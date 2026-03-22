FROM node:24-alpine AS builder

RUN apk upgrade --no-cache

WORKDIR /app

ARG BACKEND_API_URL=http://backend:8000
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_API_URL=${BACKEND_API_URL}
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runner

RUN apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001

CMD ["node", "server.js"]
