FROM node:22-alpine AS builder

WORKDIR /app

ARG BACKEND_API_URL=http://backend:8000
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_API_URL=${BACKEND_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

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
