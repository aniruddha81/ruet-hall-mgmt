FROM oven/bun:1.2.22-alpine AS builder

WORKDIR /app

ARG BACKEND_API_URL=http://backend:8000
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_API_URL=${BACKEND_API_URL}

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.2.22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 4001

CMD ["bun", "server.js"]
