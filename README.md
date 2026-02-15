# Triage & Recovery Hub

## Note

1. How you handle edge cases the AI missed.
   - I tried to solve the problem with codex locally
2. How you structure your database and async logic.
   - In this case I go with Prisma to run migration and use react-query to run interval pooling
3. How you verify and validate the AI's output.

## Technical Test

Goal: Build a system that ingests user complaints and asynchronously turns them into prioritized, "ready-to-send" drafts.

1. The Ingestion API (The "Bottle-Neck" Test)
   - Create a POST /tickets endpoint.
   - Constraint: The AI processing (which takes 3-5 seconds) must not block the HTTP response. The API must return a 201 Created status immediately to the user, while the AI processing happens in the background.
2. The AI Triage Engine (Background Worker)
   - Implement a background task that calls an LLM to:
     - Categorize: (Billing, Technical, Feature Request).
     - Score: Sentiment (1-10) and Urgency (High/Medium/Low).
     - Draft: A polite, context-aware response.
   - Constraint: Ensure the AI returns valid JSON so your database stores the Category and Score as distinct fields, not just text.
3. The Agent Dashboard
   - List View: Show tickets color-coded by Urgency (Red/Green).
   - Detail View: Allow an agent to edit the AI draft and click "Resolve" (updating the database).

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
