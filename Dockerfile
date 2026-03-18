FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src

EXPOSE 8000

CMD ["npx", "tsx", "src/index.ts"]