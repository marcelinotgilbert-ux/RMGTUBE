FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY src ./src

ENV NODE_ENV=production

EXPOSE 10000

CMD ["node", "src/index.js"]
