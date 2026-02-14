# Triage & Recovery Hub

Full-stack MVP for **Option A: AI Support "Triage & Recovery" Hub**.

## Stack

- **Frontend:** Next.js 16 + Material UI
- **Backend:** Express 5 + TypeScript
- **Database:** PostgreSQL + Prisma
- **AI Provider:** OpenAI-compatible Chat Completions endpoint
- **Realtime updates:** Server-Sent Events (`/events`)

## Environment variables

Create `apps/api/.env` from `apps/api/.env.example`:

```env
OPENAI_KEY=<api-key>
OPENAI_ENDPOINT=https://api.openai.com/v1/chat/completions
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public
```

Optional web env (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_EVENTS_URL=http://localhost:8000/events
```

## Run with Docker Compose

```bash
docker compose up --build
```

Services:
- Web: http://localhost:3000
- API: http://localhost:8000
- Postgres: localhost:5432

The API container runs `prisma migrate deploy` on startup so schema is applied automatically.

## Local development

### API

```bash
cd apps/api
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm dev
```

### Web

```bash
cd apps/web
pnpm install
pnpm dev
```

## Implemented assignment constraints

- `POST /tickets` returns immediately with `201` and processes LLM triage asynchronously.
- Background triage extracts structured JSON fields (`category`, `sentiment`, `urgency`, draft reply).
- Dashboard supports:
  - ticket list with urgency color coding,
  - detail/edit panel for AI draft,
  - resolve action.
- Real-time dashboard refresh uses SSE events from backend.
