import asyncio
from datetime import timedelta

import logfire
from dotenv import load_dotenv
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
from settings import settings

load_dotenv()

logfire.configure(token=settings.log_fire_token)
logfire.instrument_pydantic_ai()


async def main():
    client = await Client.connect(
        settings.temporal_url,
        plugins=[
            PydanticAIPlugin(),
            LogfirePlugin(setup_logfire=lambda: logfire.configure(token=settings.log_fire_token)),
        ],
    )

    async with Worker(
        client,
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
                "db",
            )
        ),
        # After a worker dies, Temporal parks the workflow on that worker's sticky
        # queue and waits this long before dispatching to the normal queue.
        # Default is 10s — reduce it so a restarted worker picks up the workflow fast.
        sticky_queue_schedule_to_start_timeout=timedelta(seconds=2),
    ):
        print("Worker started, polling task queue: coding-agent")
        await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
