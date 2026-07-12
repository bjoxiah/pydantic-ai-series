import asyncio
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from e2b import AsyncSandbox

from agent.setup import CodingDeps
from agent.workflow import AppBuildWorkflow
from agent.streaming import get_run_buffer
from auth import get_current_user
from models import (
    HealthResponse, MessageResponse, ProfileResponse, ProfileSyncRequest,
    ProjectDetailResponse, ProjectSummaryResponse, RunRequest, RunResponse,
    SettingsRequest, SettingsResponse, SignalResponse,
)
from db.engine import AsyncSessionLocal
from db.queries import (
    create_project, create_message, get_project,
    list_projects, delete_project, get_messages, get_profile,
    get_settings, upsert_profile, upsert_settings, get_project_total_tokens,
)
from redis_client import redis_client

router = APIRouter()


async def _get_owned_project(session, project_id: str, user_id: str):
    project = await get_project(session, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return project


# ── Workflow ──────────────────────────────────────────────────────────────────

@router.post("/run", response_model=RunResponse, summary="Start a new agent build workflow")
async def run_agent(
    request: Request,
    body: RunRequest,
    user_id: str = Depends(get_current_user),
):
    async with AsyncSessionLocal() as session:
        user_settings = await get_settings(session, user_id)

    missing: list[str] = []
    if not user_settings or not user_settings.github_token:
        missing.append("GitHub token")
    if not user_settings or not user_settings.github_username:
        missing.append("GitHub username")
    if not user_settings or not user_settings.github_email:
        missing.append("GitHub email")

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing GitHub credentials: {', '.join(missing)}. Please configure them in Settings before building.",
        )

    tc = request.app.state.temporal_client
    temporal_workflow_id = f"app-build-{uuid.uuid4()}"

    async with AsyncSessionLocal() as session:
        project = await create_project(session, temporal_workflow_id, body.prompt, user_id, body.selected_model)
        project_id = str(project.id)
        await create_message(
            session,
            project_id=project_id,
            type="user",
            content=body.prompt,
            events=[],
            agent_name=None,
            sequence=0,
        )

    deps = CodingDeps(
        user_id=user_id,
        project_id=project_id,
        model_name=body.selected_model,
    )
    await tc.start_workflow(
        AppBuildWorkflow.run,
        args=[body.prompt, deps],
        id=temporal_workflow_id,
        task_queue="coding-agent",
    )
    return RunResponse(project_id=project_id)


# ── Projects ──────────────────────────────────────────────────────────────────

@router.get(
    "/projects",
    response_model=list[ProjectSummaryResponse],
    summary="List recent projects for the sidebar",
)
async def get_projects(user_id: str = Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        projects = await list_projects(session, user_id=user_id, limit=20)
    return [
        ProjectSummaryResponse(
            project_id=str(p.id),
            title=p.title or "",
            status=p.status,
            created_at=p.created_at.isoformat(),
        )
        for p in projects
    ]


@router.get(
    "/projects/{project_id}/stream",
    response_class=StreamingResponse,
    summary="SSE stream of agent events for a project",
    responses={200: {"content": {"text/event-stream": {}}, "description": "Server-sent events"}},
)
async def stream_phase(project_id: str, request: Request, user_id: str = Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        await _get_owned_project(session, project_id, user_id)

    raw_last = request.headers.get("last-event-id", "")
    last_seq = int(raw_last) if raw_last.isdigit() else -1

    async def event_generator():
        pubsub = redis_client.pubsub()
        # Subscribe before reading the buffer so no live events are missed.
        await pubsub.subscribe(f"agent-events:{project_id}")
        try:
            # Replay buffered events for the current phase (empty between phases).
            # Clients that reconnect see all events from the phase start.
            buffered = await get_run_buffer(project_id)
            seen: set[str] = set()
            for seq, event_dict in enumerate(buffered):
                data = json.dumps(event_dict)
                seen.add(data)
                if seq <= last_seq:
                    continue
                yield f"id: {seq}\ndata: {data}\n\n"

            seq = len(buffered) - 1
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                data = message["data"]
                # Discard events already sent via buffer replay (race-window duplicates).
                if data in seen:
                    seen.discard(data)
                    continue
                seq += 1
                yield f"id: {seq}\ndata: {data}\n\n"
                try:
                    parsed = json.loads(data)
                    node = parsed.get("node") if parsed.get("type") == "node_change" else None
                    if node in ("complete", "awaiting_plan_approval"):
                        break
                except Exception:
                    pass
        finally:
            await pubsub.unsubscribe(f"agent-events:{project_id}")
            await pubsub.aclose()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/projects/{project_id}",
    response_model=ProjectDetailResponse,
    summary="Get project metadata and status",
    responses={404: {"description": "Project not found"}},
)
async def get_project_detail(project_id: str, user_id: str = Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        project = await _get_owned_project(session, project_id, user_id)
        total_tokens = await get_project_total_tokens(session, project_id)

    if project.sandbox_id and project.status == "complete":
        asyncio.ensure_future(AsyncSandbox.connect(project.sandbox_id))

    return ProjectDetailResponse(
        project_id=str(project.id),
        prompt=project.prompt or "",
        status=project.status,
        project_name=project.title or "",
        brief=project.plan or "",
        preview_url=project.preview_url or "",
        github_url=project.github_url or "",
        pr_url=project.pr_url or "",
        created_at=project.created_at.isoformat(),
        total_tokens=total_tokens,
    )


@router.get(
    "/projects/{project_id}/messages",
    response_model=list[MessageResponse],
    summary="Get the full conversation thread for a project",
    responses={404: {"description": "Project not found"}},
)
async def get_project_messages(project_id: str, user_id: str = Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        await _get_owned_project(session, project_id, user_id)
        messages = await get_messages(session, project_id)

    return [
        MessageResponse(
            id=str(m.id),
            project_id=str(m.project_id),
            type=m.type,
            content=m.content,
            events=m.events or [],
            agent_name=m.agent_name,
            sequence=m.sequence,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


@router.post(
    "/projects/{project_id}/approve-plan",
    response_model=SignalResponse,
    summary="Approve the generated plan and start building",
)
async def approve_plan(
    request: Request,
    project_id: str,
    user_id: str = Depends(get_current_user),
):
    async with AsyncSessionLocal() as session:
        project = await _get_owned_project(session, project_id, user_id)
    tc = request.app.state.temporal_client
    handle = tc.get_workflow_handle(project.workflow_id)
    await handle.signal(AppBuildWorkflow.approve_plan)
    return SignalResponse(signaled="approve_plan")


@router.post(
    "/projects/{project_id}/reject-plan",
    response_model=SignalResponse,
    summary="Reject the plan and request a revision",
)
async def reject_plan(
    request: Request,
    project_id: str,
    feedback: str = "",
    user_id: str = Depends(get_current_user),
):
    async with AsyncSessionLocal() as session:
        project = await _get_owned_project(session, project_id, user_id)
        tc = request.app.state.temporal_client
        handle = tc.get_workflow_handle(project.workflow_id)
        await handle.signal(AppBuildWorkflow.reject_plan, feedback)
        if feedback.strip():
            existing = await get_messages(session, project_id)
            next_seq = max((m.sequence for m in existing), default=0) + 1
            await create_message(
                session,
                project_id=project_id,
                type="user",
                content=feedback.strip(),
                events=[],
                agent_name=None,
                sequence=next_seq,
            )
    return SignalResponse(signaled="reject_plan", feedback=feedback)


@router.delete(
    "/projects/{project_id}",
    status_code=204,
    summary="Delete a project and terminate any running workflow",
)
async def delete_project_endpoint(
    request: Request,
    project_id: str,
    user_id: str = Depends(get_current_user),
):
    async with AsyncSessionLocal() as session:
        project = await _get_owned_project(session, project_id, user_id)
        temporal_wf_id = project.workflow_id
        await delete_project(session, project_id)
    if temporal_wf_id:
        tc = request.app.state.temporal_client
        try:
            await tc.get_workflow_handle(temporal_wf_id).terminate(reason="Deleted by user")
        except Exception:
            pass


# ── Profile ───────────────────────────────────────────────────────────────────

@router.post(
    "/profile/sync",
    response_model=ProfileResponse,
    summary="Upsert profile from Kinde auth user data",
)
async def sync_profile(body: ProfileSyncRequest):
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            id=body.id,
            email=body.email,
            first_name=body.first_name,
            last_name=body.last_name,
            picture=body.picture,
        )
    return ProfileResponse(
        id=profile.id,
        email=profile.email,
        first_name=profile.first_name,
        last_name=profile.last_name,
        picture=profile.picture,
    )


@router.get(
    "/profile/{kinde_id}",
    response_model=ProfileResponse,
    summary="Get profile by Kinde user ID",
)
async def get_profile_endpoint(kinde_id: str):
    async with AsyncSessionLocal() as session:
        profile = await get_profile(session, kinde_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse(
        id=profile.id,
        email=profile.email,
        first_name=profile.first_name,
        last_name=profile.last_name,
        picture=profile.picture,
    )


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get(
    "/settings",
    response_model=SettingsResponse,
    summary="Get GitHub integration settings for the current user",
)
async def read_settings(user_id: str = Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        cfg = await get_settings(session, user_id)
    if not cfg:
        return SettingsResponse(github_token_set=False, github_username="", github_email="", github_repo_private=False)
    return SettingsResponse(
        github_token_set=bool(cfg.github_token),
        github_username=cfg.github_username,
        github_email=cfg.github_email,
        github_repo_private=cfg.github_repo_private,
    )


@router.post(
    "/settings",
    response_model=SettingsResponse,
    summary="Save GitHub integration settings for a user",
)
async def save_settings(
    body: SettingsRequest,
    user_id: str = Depends(get_current_user),
):
    async with AsyncSessionLocal() as session:
        cfg = await upsert_settings(
            session,
            user_id=user_id,
            github_token=body.github_token,
            github_username=body.github_username,
            github_email=body.github_email,
            github_repo_private=body.github_repo_private,
        )
    return SettingsResponse(
        github_token_set=bool(cfg.github_token),
        github_username=cfg.github_username,
        github_email=cfg.github_email,
        github_repo_private=cfg.github_repo_private,
    )


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, summary="Liveness / readiness probe")
async def health():
    return HealthResponse(status="ok")
