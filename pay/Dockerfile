FROM oven/bun:1.2.22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json ./
RUN bun install --production

COPY src ./src

EXPOSE 8080

CMD ["bun", "src/index.ts"]