# Backend — Forge API

FastAPI application that orchestrates the AI build pipeline via Temporal.

## Key components

| File/Folder | Role |
|-------------|------|
| `main.py` | FastAPI app, lifespan (runs Alembic + starts Temporal worker) |
| `router.py` | REST + SSE endpoints |
| `agent/workflow.py` | `AppBuildWorkflow` — durable Temporal workflow |
| `agent/planner.py` | `planner_agent` — generates app plan from prompt |
| `agent/engineer.py` | `engineering_agent` — builds app in E2B sandbox |
| `agent/activities.py` | Temporal activities (sandbox, DB writes, streaming) |
| `agent/streaming.py` | Redis pub/sub for SSE event delivery |
| `agent/capability/` | File system, terminal, and git tools for the engineer agent |
| `agent/skills/expo-app-builder/SKILL.md` | Injected skill: safe package list, git workflow, file conventions |
| `db/` | SQLModel models, async CRUD queries, Alembic engine |
| `crypto.py` | Fernet encryption for stored GitHub tokens |
| `settings.py` | Pydantic Settings — reads from `.env` |

## Environment variables

See `.env.example` for the full list. Copy it to `.env` before running.

## Running locally

```bash
uv sync
uv run uvicorn main:app --reload --port 8000
```

See the [root README](../README.md) for full setup instructions.
