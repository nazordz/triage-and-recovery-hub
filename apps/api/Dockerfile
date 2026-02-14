FROM node:25.6-alpine AS base

RUN apk add --no-cache libc6-compat dumb-init
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app

COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/dist ./dist
RUN chown -R node:node /app

USER node

EXPOSE 8000
CMD ["dumb-init", "sh", "-c", "pnpm prisma migrate deploy && node ./dist/server.mjs"]
