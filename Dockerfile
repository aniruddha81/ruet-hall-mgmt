FROM node:alpine

WORKDIR /app

ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

COPY package*.json ./
RUN npm install --frozen-lockfile

COPY . .

EXPOSE 8000

CMD ["npm", "run", "dev"]