# Frontend — Forge

Next.js 16 App Router frontend for Forge.

## Key components

| File/Folder | Role |
|-------------|------|
| `src/app/` | App Router pages (landing, dashboard, chat) |
| `src/app/api/[...path]/route.ts` | Transparent proxy — forwards all API calls to FastAPI server-side |
| `src/app/api/auth/` | Kinde auth handler |
| `src/components/chat/` | Main build UI: message thread, live streaming, plan gate, preview panel |
| `src/components/landing/` | Marketing landing page |
| `src/hooks/useAgentWorkflow.ts` | SSE stream + workflow state machine |
| `src/hooks/use-projects.ts` | `useSaveSettings` — TanStack mutation for settings |
| `src/lib/api.ts` | Typed API client (calls `/api/...` — routed through Next.js proxy) |
| `src/store/` | Zustand store for sidebar project list + settings |
| `src/providers/` | QueryClient, Kinde, app store providers |

## Environment variables

See `.env.example`. Copy to `.env.local`:

```bash
cp .env.example .env.local
```

The only server-side env var is `BACKEND_URL` (used by the proxy route). All Kinde vars are also server-side — no `NEXT_PUBLIC_` vars are required.

## Running locally

```bash
npm install
npm run dev
```

See the [root README](../README.md) for full setup instructions.
