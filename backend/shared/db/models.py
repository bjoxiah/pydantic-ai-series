import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, Integer, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── Profiles ─────────────────────────────────────────────────────────────────

class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: str = Field(primary_key=True)  # Kinde user ID
    email: str = Field(default="")
    first_name: str | None = None
    last_name: str | None = None
    picture: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


# ── Projects ──────────────────────────────────────────────────────────────────

class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workflow_id: str = Field(unique=True, index=True)  # Temporal execution ID
    user_id: str | None = Field(default=None, index=True)
    title: str | None = Field(default=None, max_length=255)
    prompt: str
    status: str = Field(default="planning")
    plan: str | None = Field(default=None, sa_column=Column(Text))
    selected_model: str = Field(default="openai/gpt-5.5")
    preview_url: str | None = None
    snack_url: str | None = None
    github_url: str | None = None
    pr_url: str | None = None
    sandbox_id: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


# ── Messages ──────────────────────────────────────────────────────────────────
# Conversation thread — one row per agent run.
# type: user | plan | revision | reasoning | summary

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True)
    type: str
    content: str = Field(default="", sa_column=Column(Text))
    events: Any = Field(
        default_factory=list,
        sa_column=Column(JSONB, nullable=False, server_default=text("'[]'::jsonb")),
    )
    agent_name: str | None = None
    sequence: int = Field(default=0, sa_column=Column(Integer))
    created_at: datetime = Field(default_factory=utc_now)

    class Config:
        arbitrary_types_allowed = True


# ── AgentHistory ──────────────────────────────────────────────────────────────
# Raw Pydantic AI message history — internal, for context continuity on amendments.

class AgentHistory(SQLModel, table=True):
    __tablename__ = "agent_history"
    __table_args__ = (
        UniqueConstraint("project_id", "agent_name", name="uq_agent_history_project_agent"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True)
    agent_name: str = Field(index=True)
    messages: Any = Field(
        default=None,
        sa_column=Column(JSONB, nullable=False),
    )
    request_count: int | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    created_at: datetime = Field(default_factory=utc_now)

    class Config:
        arbitrary_types_allowed = True


# ── UserSettings ──────────────────────────────────────────────────────────────

class UserSettings(SQLModel, table=True):
    __tablename__ = "user_settings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(unique=True, index=True)  # Kinde user ID
    github_token: str = Field(default="")           # stored encrypted
    github_username: str = Field(default="")
    github_email: str = Field(default="")
    github_repo_private: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
