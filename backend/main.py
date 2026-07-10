from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from temporalio.client import Client
from temporalio.worker import Worker
from temporalio.worker.workflow_sandbox import SandboxedWorkflowRunner, SandboxRestrictions
from pydantic_ai.durable_exec.temporal import PydanticAIPlugin, LogfirePlugin

from agent.workflow import AppBuildWorkflow
from agent.activities import (
    stream_progress,
    create_sandbox,
    serve_web_build,
    save_plan,
    set_build_started,
    save_build_reasoning,
    save_build_result,
)
from db.engine import run_migrations
from redis_client import redis_client
from router import router

load_dotenv()

import logfire
from settings import settings

logfire.configure(token=settings.log_fire_token)
logfire.instrument_pydantic_ai()


def logfire_setup():
    return logfire.configure(token=settings.log_fire_token)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_migrations()

    temporal_client = await Client.connect(
        settings.temporal_url,
        plugins=[
            PydanticAIPlugin(),
            LogfirePlugin(setup_logfire=logfire_setup),
        ],
    )
    app.state.temporal_client = temporal_client

    async with Worker(
        temporal_client,
        task_queue="coding-agent",
        workflows=[AppBuildWorkflow],
        activities=[
            stream_progress,
            create_sandbox,
            serve_web_build,
            save_plan,
            set_build_started,
            save_build_reasoning,
            save_build_result,
        ],
        workflow_runner=SandboxedWorkflowRunner(
            restrictions=SandboxRestrictions.default.with_passthrough_modules(
                "settings",
                "pydantic_settings",
                "pydantic_ai_skills",
                "redis_client",
                "streaming",
                "db",
            )
        ),
    ):
        yield

    await redis_client.aclose()


app = FastAPI(title="Forge API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(router)
