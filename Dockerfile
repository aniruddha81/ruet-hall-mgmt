FROM oven/bun:1-alpine AS base
WORKDIR /usr/src/app

FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS dev
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 8000
CMD ["bun", "--watch", "src/index.ts"]

FROM base AS build
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN bun build ./src/index.ts --outdir dist --target bun

FROM base AS prod-deps
RUN apk add --no-cache python3 make g++
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS release
ENV NODE_ENV=production
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/package.json ./package.json
EXPOSE 8000
CMD ["bun", "dist/index.js"]
