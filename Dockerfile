FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

ENV NODE_ENV=docker

EXPOSE 3000
CMD ["node", "app.js"]
