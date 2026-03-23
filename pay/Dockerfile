FROM node:24.10.0-alpine3.23

RUN apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src

EXPOSE 8080

CMD ["npm", "run", "start"]