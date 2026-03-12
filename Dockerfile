FROM oven/bun:alpine

WORKDIR /app

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 4001

CMD ["bun", "run", "dev"]