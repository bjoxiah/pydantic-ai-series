# No Code AI Agent Builder

Build and configure AI agents without writing code. Create agents with custom capabilities — company knowledge (RAG + GraphRAG), web research, and email — then chat with them through a control panel or embed them as a widget on any website.

Built with [Pydantic AI](https://pydantic.dev/docs/ai/) as part of the [Master Pydantic AI series](https://github.com/bjoxiah/pydantic-ai-series).

## Tech Stack

- **Backend** — FastAPI, Pydantic AI, SQLModel, Alembic
- **Database** — PostgreSQL + pgvector (semantic search), Neo4j + Graphiti (knowledge graph)
- **Background jobs** — Inngest
- **Frontend** — Next.js, Tailwind CSS
- **Widget** — Vite + React (embeddable, framework-agnostic)
- **Observability** — Logfire
- **Capabilities** — Tavily (research), Resend (email)

## Project Structure

```
pydantic-ai-series/
├── backend/      # FastAPI server, agents, capabilities, migrations
├── frontend/     # Next.js control panel
├── widget/       # Embeddable chat widget
└── docker-compose.yml
```

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ and pnpm (only needed if running the widget locally)
- API keys: OpenRouter, Tavily, Resend, Logfire

## Setup

### 1. Environment Variables

Create `.env` in `backend/`:

```env
OPEN_ROUTER_KEY=your_key
TAVILY_API_KEY=your_key
RESEND_API_KEY=your_key
LOG_FIRE_TOKEN=your_token
INNGEST_IS_PRODUCTION=false
INNGEST_DEV_SERVER_URL=http://inngest:8288
DATABASE_URL=postgresql+psycopg://postgres:postgres@postgres:5432/nocodedb
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
```

### 2. Run the Stack

From the project root:

```bash
docker compose up
```

This starts:

| Service     | URL                          | Notes                          |
|-------------|------------------------------|---------------------------------|
| Frontend    | http://localhost:3000        | Control panel                   |
| Backend     | http://localhost:8000        | FastAPI + Pydantic AI            |
| Postgres    | localhost:5432               | pgvector enabled                |
| Neo4j       | http://localhost:7474        | Browser UI (neo4j / password)   |
| Inngest     | http://localhost:8288         | Background job dashboard         |
| pgAdmin     | http://localhost:8080        | admin@admin.com / admin          |

First run will take a few minutes to build images and pull dependencies.

### 3. Run Database Migrations

With the stack running, apply migrations inside the backend container:

```bash
docker compose exec backend alembic upgrade head
```

or from the backend folder run:

```bash
alembic upgrade head
```

### 4. Live Reload (Dev Mode)

To enable file sync and auto-rebuild on changes:

```bash
docker compose watch
```

This syncs `backend/` and `frontend/` changes into the running containers without a full rebuild, and rebuilds automatically if `pyproject.toml` or `package.json` change.

## Using the Platform

1. Open `http://localhost:3000`
2. Click **New Agent**
3. Name your agent, write instructions, pick a model
4. Select capabilities:
   - **Company Knowledge** — provide a URL or paste text; triggers a background RAG + GraphRAG ingestion pipeline (view progress in Inngest dashboard at `:8288`)
   - **Research** — gives the agent a Tavily web search tool
   - **Email** — gives the agent tools to send emails
5. Start chatting with your agent
6. Use the agent menu (⋯) to customize the **Widget Theme** or get the **Agent Id** for the widget

### Inspecting Data

- **pgAdmin** (`localhost:8080`) — connect to host `postgres`, db `nocodedb`, user `postgres`, password `postgres` — view `knowledge_chunks` and vector embeddings
- **Neo4j Browser** (`localhost:7474`) — login `neo4j` / `password` — run `MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100` to view the knowledge graph
- **Logfire** — view agent traces, tool calls, and LLM requests

## Embeddable Widget

The widget is a separate Vite + React project for building an embeddable chat script.

```bash
cd widget
pnpm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:8000
```

Run the dev playground:

```bash
pnpm dev
```

Renders at `http://localhost:5173` — simulating how it appears embedded on any website.

Build for production:

```bash
pnpm build
```

Outputs `dist/widget.umd.js` and `dist/widget.es.js` — host these on a CDN and embed with:

```html
<script src="https://your-cdn.com/widget.umd.js" data-agent-id="your-agent-id"></script>
```

The widget loads its theme and configuration automatically from your backend.

## Stopping the Stack

```bash
docker compose down
```

To also remove volumes (Postgres and Neo4j data):

```bash
docker compose down -v
```
## License

MIT