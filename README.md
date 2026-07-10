# Forge — AI-Powered React Native App Builder

> Part 4 of the **Master Pydantic AI** series on [YouTube](https://www.youtube.com/@creativejosiah).

Forge is a SaaS platform where you describe a mobile app in plain English and an AI agent builds it inside a cloud sandbox, pushes it to GitHub, and serves a live web preview — all in one workflow.

**Stack:** Pydantic AI · Temporal · FastAPI · Next.js · PostgreSQL · Redis · E2B

## Series

| Part | Topic |
|------|-------|
| 1 | Introduction to Pydantic AI |
| 2 | Building agents with tools |
| 3 | Durable workflows with Temporal |
| 4 | **Forge — full-stack AI app builder** (this repo) |

---

## Architecture

```
Browser
  └── Next.js (port 3000)
        ├── /api/[...path]  →  FastAPI (port 8000)   ← all REST calls proxied server-side
        └── SSE stream      →  FastAPI (port 8000)   ← piped through Next.js

FastAPI
  ├── Temporal Worker  →  AppBuildWorkflow
  │     ├── PydanticAI planner_agent    (plan the app)
  │     └── PydanticAI engineering_agent (build in E2B sandbox)
  ├── PostgreSQL  (projects, messages, settings)
  └── Redis       (SSE pub/sub)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker + Docker Compose | v2+ |
| Node.js | 18+ |
| Python | 3.12 |
| [uv](https://docs.astral.sh/uv/) | latest |

---

## API Keys Required

| Service | Purpose | Get it at |
|---------|---------|-----------|
| [OpenRouter](https://openrouter.ai) | AI models (planner + engineer agents) | openrouter.ai |
| [E2B](https://e2b.dev) | Cloud sandbox for building apps | e2b.dev |
| [Kinde](https://kinde.com) | Authentication | kinde.com |
| [Context7](https://context7.com) | Live docs MCP for the engineer agent | context7.com |
| [Logfire](https://logfire.pydantic.dev) | Observability | logfire.pydantic.dev |

---

## Setup

### 1. Clone and enter the repo

```bash
git clone <repo-url>
cd pydantic-ai-series
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
OPEN_ROUTER_API_KEY=sk-or-v1-...
CONTEXT7_API_KEY=ctx7sk-...
LOG_FIRE_TOKEN=pylf_v1_us_...
E2B_API_KEY=e2b_...
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
REDIS_URL=redis://localhost:6379
TEMPORAL_URL=localhost:7233
ENCRYPTION_KEY=<generate below>
```

Generate the encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Configure the frontend

```bash
cp frontend/.env.example frontend/.env.local
```

Fill in `frontend/.env.local`:

```env
BACKEND_URL=http://localhost:8000

KINDE_CLIENT_ID=<from kinde dashboard>
KINDE_CLIENT_SECRET=<from kinde dashboard>
KINDE_ISSUER_URL=https://yourapp.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard
```

---

## Running the project

### Option A — Docker Compose (recommended)

Starts all infrastructure and both application services:

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Temporal UI | http://localhost:8080 |
| pgAdmin | http://localhost:5050 (admin@admin.com / admin) |
| RedisInsight | http://localhost:5540 |

> The `ENCRYPTION_KEY` in `backend/.env` must also be set in your shell or a `.env` file at the project root for Docker Compose's `${ENCRYPTION_KEY}` substitution to work:
> ```bash
> export ENCRYPTION_KEY=$(grep ENCRYPTION_KEY backend/.env | cut -d= -f2)
> docker compose up --build
> ```

### Option B — Run services locally

**Step 1 — Start infrastructure** (Postgres, Redis, Temporal):

```bash
docker compose up postgres redis temporal temporal-ui -d
```

**Step 2 — Run the backend**:

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

Alembic migrations run automatically on startup.

**Step 3 — Run the frontend**:

```bash
cd frontend
npm install
npm run dev
```

---

## Project structure

```
.
├── backend/          # FastAPI app + Temporal worker
│   ├── agent/        # Pydantic AI agents, workflow, activities, streaming
│   ├── db/           # SQLModel models, async queries, Alembic engine
│   ├── alembic/      # Database migrations
│   └── main.py       # App entrypoint + lifespan (worker + migrations)
│
├── frontend/         # Next.js 16 app
│   └── src/
│       ├── app/      # App Router pages + /api/[...path] proxy
│       ├── components/
│       ├── hooks/    # useAgentWorkflow (SSE + state), useSaveSettings
│       └── lib/api.ts
│
└── docker-compose.yml
```

---

## Database migrations

Migrations are managed with Alembic and run automatically on backend startup.

To create a new migration after changing `db/models.py`:

```bash
cd backend
uv run alembic revision --autogenerate -m "describe the change"
uv run alembic upgrade head
```
