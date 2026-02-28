FROM oven/bun:1-alpine AS base
WORKDIR /usr/src/app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS dev
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 4001
CMD ["bun", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM base AS build
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS release
ENV NODE_ENV=production
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/next.config.ts ./next.config.ts
EXPOSE 4001
CMD ["bun", "run", "start", "--", "--hostname", "0.0.0.0"]
