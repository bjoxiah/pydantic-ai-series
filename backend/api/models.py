from pydantic import BaseModel
from typing import Any, Literal


# ── Request models ────────────────────────────────────────────────────────────

class RunRequest(BaseModel):
    prompt: str
    selected_model: str = "openai/gpt-5.5"


class ProfileSyncRequest(BaseModel):
    id: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    picture: str | None = None


class SettingsRequest(BaseModel):
    github_token: str = ""
    github_username: str = ""
    github_email: str = ""
    github_repo_private: bool = False


# ── Response models ───────────────────────────────────────────────────────────

class RunResponse(BaseModel):
    project_id: str


class SignalResponse(BaseModel):
    signaled: str
    feedback: str = ""


class MessageResponse(BaseModel):
    id: str
    project_id: str
    type: Literal["user", "plan", "revision", "reasoning", "summary"]
    content: str
    events: list[Any]
    agent_name: str | None
    sequence: int
    created_at: str


class ProjectDetailResponse(BaseModel):
    project_id: str
    prompt: str
    status: str
    project_name: str
    brief: str
    preview_url: str
    github_url: str
    pr_url: str
    created_at: str
    total_tokens: int = 0


class ProjectSummaryResponse(BaseModel):
    project_id: str
    title: str
    status: str
    created_at: str


class ProfileResponse(BaseModel):
    id: str
    email: str
    first_name: str | None
    last_name: str | None
    picture: str | None


class SettingsResponse(BaseModel):
    github_token_set: bool
    github_username: str
    github_email: str
    github_repo_private: bool = False


class HealthResponse(BaseModel):
    status: str
