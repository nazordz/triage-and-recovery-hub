FROM node:25.6-alpine AS base

RUN apk add --no-cache libc6-compat dumb-init
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

RUN chown -R node:node /app

USER node

EXPOSE 3000
CMD ["dumb-init", "node", "./server.js"]
