# Triage & Recovery Hub

Technical Test

## Stack

- **Frontend:** Next.js 16 + Material UI + Formik & yup + react-query
- **Backend:** Express 5 + Express + TypeScript + express-validator
- **Database:** PostgreSQL + Prisma
- **AI Provider:** OpenAI-compatible Chat Completions endpoint
- **Realtime updates:** Server-Sent Events (`/events`)

## Environment variables

Create `apps/api/.env` from `apps/api/.env.example`:

```env
OPENAI_KEY=<api-key>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public
```

Optional web env (`apps/web/.env`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_EVENTS_URL=http://localhost:8000/events
```

## Run with Docker Compose

```bash
docker compose up --build
```

Services:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Postgres: `localhost:5432`

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
