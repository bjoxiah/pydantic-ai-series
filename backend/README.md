# Backend — Forge API

FastAPI application that orchestrates the AI build pipeline via Temporal.

## Key components

| File/Folder | Role |
|-------------|------|
| `api/main.py` | FastAPI app, lifespan (runs Alembic migrations, connects Temporal) |
| `api/router.py` | REST + SSE endpoints — all routes protected with JWT auth |
| `api/auth.py` | `get_current_user` — verifies Kinde RS256 JWT via JWKS, returns `sub` as user_id |
| `api/models.py` | Pydantic request/response models |
| `shared/agent/workflow.py` | `AppBuildWorkflow` — durable Temporal workflow |
| `shared/agent/planner.py` | `planner_agent` — generates app plan from prompt |
| `shared/agent/engineer.py` | `engineering_agent` — builds app in E2B sandbox |
| `shared/agent/activities.py` | Temporal activities with heartbeating (`heartbeat_timeout=30s`) |
| `shared/agent/streaming.py` | Redis pub/sub for SSE delivery + activity heartbeat loop |
| `shared/agent/capability/` | File system, terminal, and git tools for the engineer agent |
| `shared/agent/skills/` | Injected skill: safe package list, git workflow, file conventions |
| `shared/db/` | SQLModel models, async CRUD queries (projects scoped by `user_id`) |
| `shared/crypto.py` | Fernet encryption for stored GitHub tokens |
| `shared/settings.py` | Pydantic Settings — reads from `backend/.env` |
| `worker/worker.py` | Temporal worker (`sticky_queue_schedule_to_start_timeout=2s`) |

## Environment variables

Copy `.env.example` to `.env` and fill in all values. Key variables:

| Variable | Description |
|----------|-------------|
| `OPEN_ROUTER_API_KEY` | AI model access (OpenRouter) |
| `E2B_API_KEY` | Cloud sandbox for building apps |
| `KINDE_ISSUER_URL` | Kinde domain — used to fetch JWKS for JWT verification |
| `ENCRYPTION_KEY` | Fernet key for encrypting GitHub tokens in the DB |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `TEMPORAL_URL` | Temporal server address |

## Running locally

```bash
# From repo root — start infrastructure
docker compose up postgres redis temporal -d

# API (from backend/api/)
uv sync
uv run uvicorn main:app --reload --port 8000

# Worker (separate terminal, from backend/worker/)
uv run python worker.py
```

Alembic migrations run automatically on API startup.

See the [root README](../README.md) for full setup and Docker Compose instructions.
