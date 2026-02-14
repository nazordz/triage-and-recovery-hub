# AGENTS Guide

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

## Project Layout

1. `apps/api`: Express 5 + TypeScript backend, Prisma + PostgreSQL.
   - `./src/controllers`: folder to store function that work as application logic
   - `./src/configs`: folder to store configs to library
2. `apps/web`: Next.js 16 (App Router) + TypeScript frontend.
   - `./src/components/`: folder to store reactjs components
   - `./src/app/`: folder to store nextjs pages as AppRouter
3. `compose.yaml`: Local multi-service stack (`api`, `web`, `postgres`).
4. Root is not a pnpm workspace manager for both apps; each app is managed independently.

## Tooling Baseline

- Runtime: Node.js (Dockerfiles use Node 25 Alpine).
- Package manager: `pnpm` in each app folder.
- Language: TypeScript (`strict` enabled in both apps).

## Install And Run

1. API
   - `cd apps/api`
   - `pnpm install`
   - `pnpm dev` (preferred for local development)
   - `pnpm type-check`
   - `pnpm build`

2. Web
   - `cd apps/web`
   - `pnpm install`
   - `pnpm dev`
   - `pnpm lint`
   - `pnpm build`

3. Full stack with Docker
   - From repo root: `docker compose up --build`
   - Services: web on `:3000`, api on `:8000`, postgres on `:5432`.

## Environment And Secrets

- ENV files: `apps/api/.env` and `apps/web/.env`.
- `.env` example on file `.env.example` in same folder.
- Never print secret values in logs, PR descriptions, issues, or commit messages.
- Never commit new `.env` files or plaintext credentials.
- If credentials are exposed, rotate them and replace with placeholders in shared docs.

## Database / Prisma

- Prisma schema: `apps/api/prisma/schema.prisma`.
- Prisma config: `apps/api/prisma.config.ts` (reads `DATABASE_URL`).
- Generated client output path: `apps/api/src/generated/prisma`.
- When schema changes, run from `apps/api`:
  - `pnpm prisma generate`
  - `pnpm prisma migrate dev --name <change_name>` (for local migration work)

## Code Conventions

- Keep changes scoped to the relevant app.
- Reuse existing stack and patterns; do not introduce new frameworks without explicit request.
- Use path alias `@/*` where already configured.
- Web uses Next.js App Router under `apps/web/src/app`.
- API entrypoint logic lives in `apps/api/src/server.ts`.

## Validation Checklist Before Handoff

1. If API files changed:
   - Run `pnpm type-check` in `apps/api`.
   - Run `pnpm build` in `apps/api` for build-impacting changes.

2. If Web files changed:
   - Run `pnpm lint` in `apps/web`.
   - Run `pnpm build` in `apps/web` for route/config/runtime changes.

3. If Prisma schema changed:
   - Run `pnpm prisma generate` in `apps/api`.
   - Confirm migrations are created/updated as expected.

## Known Repo Notes

- `apps/api` has a `start` script targeting `src/server.js` while source is `src/server.ts`; prefer `pnpm dev` for local API work unless start script is intentionally updated.
- Root `README.md` is minimal; update docs when adding new setup/runtime requirements.
