import asyncio
from e2b import AsyncSandbox
from temporalio import activity

from .streaming import publish_event, clear_run_buffer, get_run_buffer
from db.engine import AsyncSessionLocal
from db.queries import create_message, get_settings, save_agent_history, update_project

_SERVE_PORT = 3000


@activity.defn
async def stream_progress(project_id: str, node: str, status: str) -> None:
    await publish_event(project_id, {"type": "node_change", "node": node, "status": status})


@activity.defn
async def create_sandbox(user_id: str) -> str:
    async with AsyncSessionLocal() as session:
        user_settings = await get_settings(session, user_id)

    if not user_settings or not user_settings.github_token:
        raise RuntimeError(
            f"No GitHub credentials found for user {user_id}. "
            "Please configure them in Settings before running a build."
        )

    sandbox = await AsyncSandbox.create(
        template="react-native-node22",
        timeout=3600,
        envs={
            "NODE_PATH": "/usr/local/lib/node_modules:/usr/lib/node_modules",
            "GITHUB_USERNAME": user_settings.github_username,
            "GITHUB_TOKEN": user_settings.github_token,
            "GITHUB_EMAIL": user_settings.github_email,
        },
        lifecycle={
            'on_timeout': 'pause',
            'auto_resume': False
        }
    )
    return sandbox.sandbox_id


@activity.defn
async def serve_web_build(sandbox_id: str, project_path: str, app_name: str) -> dict:
    sandbox = await AsyncSandbox.connect(sandbox_id)

    export_proc = await sandbox.commands.run(
        "npx expo export --platform web",
        cwd=project_path,
        timeout=0,
        background=True,
    )
    export_result = await export_proc.wait()
    if export_result.exit_code != 0:
        raise RuntimeError(f"expo export failed:\n{export_result.stderr[-1000:]}")

    await sandbox.commands.run(
        f"serve ./dist -p {_SERVE_PORT} --single",
        cwd=project_path,
        timeout=0,
        background=True,
    )
    await asyncio.sleep(2)

    return {"preview_url": f"https://{sandbox.get_host(_SERVE_PORT)}", "app_name": app_name}


@activity.defn
async def save_plan(
    project_id: str,
    project_name: str,
    brief: str,
    messages: list[dict],
    usage: dict | None,
    message_sequence: int,
    message_type: str,  # "plan" | "revision"
) -> None:
    events = await get_run_buffer(project_id)
    content = next(
        (e.get("output", {}).get("brief", brief) for e in events if e.get("type") == "agent_output"),
        brief,
    )

    async with AsyncSessionLocal() as session:
        await update_project(session, project_id, title=project_name, plan=brief, status="awaiting_plan_approval")
        await create_message(session, project_id=project_id, type=message_type, content=content,
                             events=events, agent_name="planner_agent", sequence=message_sequence)
        await save_agent_history(session, project_id, "planner_agent", messages, usage)

    await clear_run_buffer(project_id)


@activity.defn
async def set_build_started(project_id: str, sandbox_id: str) -> None:
    async with AsyncSessionLocal() as session:
        await update_project(session, project_id, status="building", sandbox_id=sandbox_id)


@activity.defn
async def save_build_reasoning(
    project_id: str,
    messages: list[dict],
    usage: dict | None,
    message_sequence: int,
) -> None:
    events = await get_run_buffer(project_id)
    content = "".join(e.get("text", "") for e in events if e.get("type") == "text_delta") or "Build complete."

    async with AsyncSessionLocal() as session:
        await create_message(session, project_id=project_id, type="reasoning", content=content,
                             events=events, agent_name="engineering_agent", sequence=message_sequence)
        await save_agent_history(session, project_id, "engineering_agent", messages, usage)

    await clear_run_buffer(project_id)


@activity.defn
async def save_build_result(
    project_id: str,
    preview_url: str,
    github_url: str,
    pr_url: str,
    build_summary: str,
    message_sequence: int,
) -> None:
    content = build_summary.strip() or "Build complete."

    async with AsyncSessionLocal() as session:
        await update_project(session, project_id, status="complete",
                             preview_url=preview_url, github_url=github_url, pr_url=pr_url)
        await create_message(session, project_id=project_id, type="summary", content=content,
                             events=[], agent_name=None, sequence=message_sequence + 1)
