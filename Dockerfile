FROM oven/bun:alpine

WORKDIR /app

ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 8080

CMD ["bun", "run", "dev"]