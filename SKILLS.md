# SKILLS

This file defines practical, reusable skills for working in this repository.

## skill-api-development

Use when changing backend behavior in `apps/api` (Express + TypeScript + Prisma).

### Steps
1. Go to API app:
   - `cd apps/api`
2. Install deps (if needed):
   - `pnpm install`
3. Run API in dev:
   - `pnpm dev`
4. Validate:
   - `pnpm type-check`
   - `pnpm build` (for build-impacting changes)

### Notes
- Keep logic in `apps/api/src/controllers` and configs in `apps/api/src/configs`.
- API entrypoint is `apps/api/src/server.ts`.

## skill-web-development

Use when changing frontend behavior in `apps/web` (Next.js App Router + TypeScript).

### Steps
1. Go to web app:
   - `cd apps/web`
2. Install deps (if needed):
   - `pnpm install`
3. Run web app:
   - `pnpm dev`
4. Validate:
   - `pnpm lint`
   - `pnpm build` (for route/config/runtime changes)

### Notes
- Prefer `@/*` imports where configured.
- App Router lives under `apps/web/src/app`.
- Place shared UI in `apps/web/src/components`.

## skill-prisma-workflow

Use when editing database schema or model behavior.

### Files
- Schema: `apps/api/prisma/schema.prisma`
- Prisma config: `apps/api/prisma.config.ts`
- Generated client: `apps/api/src/generated/prisma`

### Steps
1. Go to API app:
   - `cd apps/api`
2. Generate Prisma client:
   - `pnpm prisma generate`
3. Create/apply local migration:
   - `pnpm prisma migrate dev --name <change_name>`
4. Confirm migration status:
   - `pnpm prisma migrate status`

### Notes
- Ensure `apps/api/.env` has `DATABASE_URL`.
- Do not commit plaintext secrets.

## skill-fullstack-local-run

Use when running API + web + PostgreSQL together.

### Steps
1. From repo root:
   - `docker compose up --build`
2. Endpoints:
   - Web: `http://localhost:3000`
   - API: `http://localhost:8000`
   - Postgres: `localhost:5432`

## skill-handoff-checklist

Use before merging or handing work off.

### If API changed
- `cd apps/api && pnpm type-check`
- `cd apps/api && pnpm build` (if build-impacting)

### If Web changed
- `cd apps/web && pnpm lint`
- `cd apps/web && pnpm build` (if route/config/runtime-impacting)

### If Prisma schema changed
- `cd apps/api && pnpm prisma generate`
- Ensure migration files are created/updated as expected

## skill-safety

Use for all work in this repo.

### Rules
- Keep changes scoped to the relevant app.
- Reuse existing stack and patterns.
- Do not commit `.env` files or credentials.
- Prefer non-destructive git operations.
