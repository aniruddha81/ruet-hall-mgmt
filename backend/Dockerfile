FROM node:24.14.0-alpine3.23

RUN apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force

COPY drizzle.config.ts ./
COPY src ./src

RUN mkdir -p public/temp

EXPOSE 8000

CMD ["npm", "run", "start"]