FROM oven/bun:1.2.22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder

WORKDIR /app

ARG BACKEND_API_URL=http://ruet-backend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_API_URL=${BACKEND_API_URL}

COPY . .
RUN bun run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001

CMD ["node", "server.js"]