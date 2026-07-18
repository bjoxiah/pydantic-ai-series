# Part 4 — Forge: AI-Powered App Builder

[![Watch on YouTube](https://img.shields.io/badge/Watch-Part%204-red)](https://youtu.be/J0_GeI8Srzc)
[![Series Overview](https://img.shields.io/badge/Series-Overview-blue)](https://github.com/bjoxiah/pydantic-ai-series)

> Part of the **[Master Pydantic AI Series](https://github.com/bjoxiah/pydantic-ai-series)** — a hands-on series on building production AI agents with Pydantic AI.

Forge is a SaaS platform where you describe a mobile app in plain English and an AI agent builds it inside a cloud sandbox, pushes it to GitHub, and serves a live web preview — all in one durable workflow.

**Stack:** Pydantic AI · Temporal · FastAPI · Next.js · PostgreSQL · Redis · E2B

## Series Navigation

| Part | Topic | Video | Branch |
|------|-------|-------|--------|
| Part 1 | Foundation & AG-UI Protocol | [![Part 1](https://img.shields.io/badge/Watch-Part%201-red)](https://youtu.be/zgrGWLNnfqg) | [`intro-lessons`](https://github.com/bjoxiah/pydantic-ai-series/tree/intro-lessions) · [`ag-ui-protocol-lesson`](https://github.com/bjoxiah/pydantic-ai-series/tree/ag-ui-protocol-lesson) |
| Part 2 | Multi-Agent Systems & Copilotkit | [![Part 2](https://img.shields.io/badge/Watch-Part%202-red)](https://youtu.be/rJrCAssCqpE) | [`multi-agent`](https://github.com/bjoxiah/pydantic-ai-series/tree/multi-agent) |
| Part 3 | No Code AI Agent Builder | [![Part 3](https://img.shields.io/badge/Watch-Part%203-red)](https://youtu.be/ILHtYme4O60) | [`no-code-agent`](https://github.com/bjoxiah/pydantic-ai-series/tree/no-code-agent) |
| **Part 4** | **Forge — AI-Powered App Builder** | [![Part 4](https://img.shields.io/badge/Watch-Part%204-red)](https://youtu.be/J0_GeI8Srzc) | **← you are here** |

---

## Architecture

```
Browser
  └── Next.js (port 3000)
        ├── Kinde middleware  →  protects all routes, manages session
        ├── /api/[...path]   →  proxy: attaches Bearer token → FastAPI (port 8000)
        └── SSE stream       →  EventSource through same proxy, auto-reconnects

FastAPI
  ├── auth.py (PyJWT + JWKS)  →  verifies Kinde RS256 JWT on every request
  ├── router.py               →  REST + SSE endpoints (all protected)
  └── Temporal Worker
        ├── PydanticAI planner_agent     (plan the app)
        └── PydanticAI engineering_agent (build in E2B sandbox)

Data
  ├── PostgreSQL  (projects, messages, user settings)
  └── Redis       (SSE pub/sub channel per project)
```

### Durability

Workflows survive worker crashes. Two mechanisms cooperate to minimize recovery time:

- **Sticky queue timeout** (`2s`) — Temporal stops waiting for the dead worker's queue and dispatches to any healthy worker within 2 seconds instead of the default 10.
- **Activity heartbeating** — every long-running activity sends a heartbeat every 5 seconds. `heartbeat_timeout=30s` means Temporal detects a dead worker and schedules a retry within 30 seconds, rather than waiting out the full `start_to_close_timeout` (10 minutes).

### Auth flow

```
Kinde (cloud IdP)
  → issues RS256 JWT (access token stored in session cookie)

Browser → Next.js proxy
  → getKindeServerSession().getAccessTokenRaw() extracts raw JWT
  → forwarded as Authorization: Bearer <jwt> to FastAPI

FastAPI auth.py
  → PyJWKClient fetches JWKS from {KINDE_ISSUER_URL}/.well-known/jwks.json
  → validates RS256 signature, extracts sub claim as user_id
  → all project queries scoped to that user_id
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

| Service | Purpose | Where |
|---------|---------|-------|
| [OpenRouter](https://openrouter.ai) | AI models (planner + engineer agents) | openrouter.ai |
| [E2B](https://e2b.dev) | Cloud sandbox for building apps | e2b.dev |
| [Kinde](https://kinde.com) | Authentication | kinde.com |
| [Context7](https://context7.com) | Live docs MCP for the engineer agent | context7.com |
| [Logfire](https://logfire.pydantic.dev) | Observability | logfire.pydantic.dev |

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd pydantic-ai-series
```

### 2. Backend environment

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
# AI & tooling
OPEN_ROUTER_API_KEY=sk-or-v1-...
CONTEXT7_API_KEY=ctx7sk-...
LOG_FIRE_TOKEN=pylf_v1_us_...
E2B_API_KEY=e2b_...

# Auth — must match KINDE_ISSUER_URL in frontend/.env.local
KINDE_ISSUER_URL=https://yourapp.kinde.com

# Token encryption
ENCRYPTION_KEY=<generate below>

# Infrastructure — Docker Compose overrides these with container hostnames
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
REDIS_URL=redis://localhost:6379
TEMPORAL_URL=localhost:7233
```

Generate the encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Frontend environment

```bash
cp frontend/.env.example frontend/.env.local
```

Fill in `frontend/.env.local`:

```env
BACKEND_URL=http://localhost:8000

# From your Kinde app dashboard (https://app.kinde.com)
KINDE_CLIENT_ID=<your-client-id>
KINDE_CLIENT_SECRET=<your-client-secret>
KINDE_ISSUER_URL=https://yourapp.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard
```

> **Important:** `KINDE_ISSUER_URL` must be identical in both `.env` files. The frontend uses it for auth redirects; the backend uses it to fetch the JWKS signing keys that verify JWTs.

---

## Running the project

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/docs |
| Temporal UI | http://localhost:8080 |
| pgAdmin | http://localhost:5050 (admin@admin.com / admin) |
| RedisInsight | http://localhost:5540 |

Alembic migrations run automatically on API startup. The worker starts alongside the API container.

### 4. Configure GitHub credentials

Once the app is running, open **http://localhost:3000**, sign in, and click the settings icon. You must fill in:

| Field | Where to get it |
|-------|----------------|
| GitHub Username | Your GitHub username |
| GitHub Token | [github.com/settings/tokens](https://github.com/settings/tokens) — needs `repo` scope |
| Repo visibility | Public or Private |

The agent uses these to create repos, push code, and open pull requests on your behalf. Builds will fail without them.

To restart only the worker (for the durability demo):

```bash
docker compose restart worker
# or kill and restart to demonstrate Temporal recovery:
docker compose stop worker && docker compose start worker
```

### Option B — Local development

**Step 1 — Start infrastructure:**

```bash
docker compose up postgres redis temporal temporal-ui -d
```

**Step 2 — Backend API:**

```bash
cd backend
uv sync
cd api
uv run uvicorn main:app --reload --port 8000
```

**Step 3 — Temporal worker** (separate terminal):

```bash
cd backend/worker
uv run python worker.py
```

**Step 4 — Frontend:**

```bash
cd frontend
pnpm install   # or npm install
pnpm dev       # or npm run dev
```

Open http://localhost:3000.

---

## Project structure

```
.
├── backend/
│   ├── api/
│   │   ├── main.py        # FastAPI app, lifespan, CORS
│   │   ├── router.py      # REST + SSE endpoints (all JWT-protected)
│   │   ├── auth.py        # get_current_user — PyJWT RS256 verification via Kinde JWKS
│   │   └── models.py      # Pydantic request/response models
│   ├── shared/
│   │   ├── agent/
│   │   │   ├── workflow.py    # AppBuildWorkflow (durable Temporal workflow)
│   │   │   ├── activities.py  # Temporal activities with heartbeating
│   │   │   ├── streaming.py   # Redis pub/sub + SSE event handler
│   │   │   ├── planner.py     # planner_agent — generates app plan
│   │   │   └── engineer.py    # engineering_agent — builds app in E2B
│   │   ├── db/
│   │   │   ├── models.py      # SQLModel table definitions
│   │   │   └── queries.py     # Async CRUD (projects scoped by user_id)
│   │   ├── settings.py        # Pydantic Settings (reads backend/.env)
│   │   └── crypto.py          # Fernet encryption for GitHub tokens
│   └── worker/
│       └── worker.py          # Temporal worker (sticky_queue_timeout=2s)
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── api/[...path]/ # Proxy: attaches Kinde Bearer token to all backend calls
│       │   └── api/auth/      # Kinde auth callback handler
│       ├── components/chat/
│       │   └── ConnectionBanner.tsx  # Disconnected / reconnecting / back-online UI
│       ├── hooks/
│       │   └── useAgentWorkflow.ts   # EventSource with manual retry on fatal close
│       └── lib/api.ts         # Typed API client
│
└── docker-compose.yml
```

---

## How the SSE reconnect works

The frontend uses the browser's native `EventSource` API pointing at `/api/projects/{id}/stream`. The Next.js proxy adds the auth header server-side before forwarding to FastAPI.

Per the EventSource spec, any HTTP error (5xx, connection reset) causes a **fatal close** — `readyState = CLOSED` — and the browser stops retrying. The hook detects this in `onerror`, sets `connectionState = "disconnected"`, and schedules `setTimeout(openEventSource, 3000)` to reopen.

On reconnect (`onopen` after a disconnect), the hook:
1. Fetches the current project status from the DB
2. Fetches any messages that arrived while offline
3. If the workflow is still active, resumes streaming; if it finished, closes cleanly

The `ConnectionBanner` component surfaces three states: amber "Disconnected" (bouncing dots), blue "Reconnecting" (spinner), green "Back online" (auto-fades after 3s).

---

## Database migrations

Migrations are managed with Alembic and run automatically on API startup.

To create a migration after changing `shared/db/models.py`:

```bash
cd backend
uv run alembic revision --autogenerate -m "describe the change"
uv run alembic upgrade head
```
