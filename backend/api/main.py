from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from temporalio.client import Client
from pydantic_ai.durable_exec.temporal import PydanticAIPlugin, LogfirePlugin

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
