import uuid as _uuid
from datetime import datetime, timezone
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import text as sa_text, func as sa_func
from sqlmodel import select

from .models import AgentHistory, Message, Profile, Project, UserSettings
from crypto import encrypt, decrypt


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── Projects ──────────────────────────────────────────────────────────────────

async def create_project(
    session: AsyncSession,
    workflow_id: str,
    prompt: str,
    user_id: str = "",
    selected_model: str = "openai/gpt-5.5",
) -> Project:
    title = prompt.strip()[:60] + ("…" if len(prompt) > 60 else "")
    project = Project(workflow_id=workflow_id, title=title, prompt=prompt, user_id=user_id, selected_model=selected_model)
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def update_project(
    session: AsyncSession,
    project_id: str,
    **fields,
) -> Project | None:
    result = await session.exec(
        select(Project).where(Project.id == _uuid.UUID(project_id))
    )
    project = result.one_or_none()
    if not project:
        return None
    for key, value in fields.items():
        if hasattr(project, key):
            setattr(project, key, value)
    project.updated_at = _utc_now()
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def get_project(
    session: AsyncSession,
    project_id: str,
) -> Project | None:
    result = await session.exec(
        select(Project).where(Project.id == _uuid.UUID(project_id))
    )
    return result.one_or_none()


async def get_project_by_workflow(
    session: AsyncSession,
    workflow_id: str,
) -> Project | None:
    result = await session.exec(
        select(Project).where(Project.workflow_id == workflow_id)
    )
    return result.one_or_none()


async def list_projects(
    session: AsyncSession,
    user_id: str,
    limit: int = 20,
) -> list[Project]:
    result = await session.exec(
        select(Project)
        .where(Project.user_id == user_id)
        .order_by(Project.created_at.desc())
        .limit(limit)
    )
    return result.all()


async def delete_project(session: AsyncSession, project_id: str) -> None:
    pid = _uuid.UUID(project_id)
    for table in ("messages", "agent_history"):
        try:
            await session.exec(
                sa_text(f"DELETE FROM {table} WHERE project_id = :pid").bindparams(pid=pid)
            )
        except Exception:
            await session.rollback()

    await session.exec(
        sa_text("DELETE FROM projects WHERE id = :pid").bindparams(pid=pid)
    )
    await session.commit()


# ── Messages (conversation thread) ───────────────────────────────────────────

async def create_message(
    session: AsyncSession,
    project_id: str,
    type: str,
    content: str,
    events: list[dict],
    agent_name: str | None,
    sequence: int,
) -> Message:
    msg = Message(
        project_id=_uuid.UUID(project_id),
        type=type,
        content=content,
        events=events,
        agent_name=agent_name,
        sequence=sequence,
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


async def get_messages(
    session: AsyncSession,
    project_id: str,
) -> list[Message]:
    result = await session.exec(
        select(Message)
        .where(Message.project_id == _uuid.UUID(project_id))
        .order_by(Message.sequence)
    )
    return result.all()


# ── Agent History (raw Pydantic AI context) ───────────────────────────────────

async def save_agent_history(
    session: AsyncSession,
    project_id: str,
    agent_name: str,
    messages: list[dict],
    usage: dict | None = None,
) -> None:
    stmt = pg_insert(AgentHistory).values(
        project_id=_uuid.UUID(project_id),
        agent_name=agent_name,
        messages=messages,
        request_count=usage.get("requests") if usage else None,
        input_tokens=usage.get("input_tokens") if usage else None,
        output_tokens=usage.get("output_tokens") if usage else None,
    ).on_conflict_do_update(
        index_elements=["project_id", "agent_name"],
        set_={
            "messages": messages,
            "request_count": usage.get("requests") if usage else None,
            "input_tokens": usage.get("input_tokens") if usage else None,
            "output_tokens": usage.get("output_tokens") if usage else None,
            "created_at": _utc_now(),
        },
    )
    await session.exec(stmt)
    await session.commit()


async def load_agent_history(
    session: AsyncSession,
    project_id: str,
    agent_name: str,
) -> list[dict] | None:
    result = await session.exec(
        select(AgentHistory).where(
            AgentHistory.project_id == _uuid.UUID(project_id),
            AgentHistory.agent_name == agent_name,
        )
    )
    record = result.one_or_none()
    if not record:
        return None
    return record.messages


async def get_project_total_tokens(session: AsyncSession, project_id: str) -> int:
    result = await session.exec(
        select(
            sa_func.coalesce(sa_func.sum(AgentHistory.input_tokens), 0)
            + sa_func.coalesce(sa_func.sum(AgentHistory.output_tokens), 0)
        ).where(AgentHistory.project_id == _uuid.UUID(project_id))
    )
    return result.one() or 0


# ── Profiles ──────────────────────────────────────────────────────────────────

async def upsert_profile(
    session: AsyncSession,
    id: str,
    email: str,
    first_name: str | None = None,
    last_name: str | None = None,
    picture: str | None = None,
) -> Profile:
    result = await session.exec(
        select(Profile).where(Profile.id == id)
    )
    profile = result.one_or_none()

    if profile:
        profile.email      = email
        profile.first_name = first_name
        profile.last_name  = last_name
        profile.picture    = picture
        profile.updated_at = _utc_now()
    else:
        profile = Profile(
            id=id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            picture=picture,
        )

    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def get_profile(
    session: AsyncSession,
    id: str,
) -> Profile | None:
    result = await session.exec(
        select(Profile).where(Profile.id == id)
    )
    return result.one_or_none()


# ── User Settings ─────────────────────────────────────────────────────────────

async def get_settings(
    session: AsyncSession,
    user_id: str,
) -> UserSettings | None:
    result = await session.exec(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    row = result.one_or_none()
    if row and row.github_token:
        row.github_token = decrypt(row.github_token)
    return row


async def upsert_settings(
    session: AsyncSession,
    user_id: str,
    github_token: str,
    github_username: str,
    github_email: str,
    github_repo_private: bool = False,
) -> UserSettings:
    result = await session.exec(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.one_or_none()
    encrypted_token = encrypt(github_token) if github_token else ""

    if settings:
        settings.github_token        = encrypted_token
        settings.github_username     = github_username
        settings.github_email        = github_email
        settings.github_repo_private = github_repo_private
        settings.updated_at          = _utc_now()
    else:
        settings = UserSettings(
            user_id=user_id,
            github_token=encrypted_token,
            github_username=github_username,
            github_email=github_email,
            github_repo_private=github_repo_private,
        )

    session.add(settings)
    await session.commit()
    await session.refresh(settings)
    settings.github_token = github_token
    return settings
