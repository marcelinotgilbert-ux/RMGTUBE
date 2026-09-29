FROM node:22-bookworm-slim

WORKDIR /app

COPY server/package*.json ./
RUN npm install

COPY server/src ./src

COPY web/package*.json ./web/
RUN cd web && npm install

COPY web ./web
RUN cd web && npm run build

ENV NODE_ENV=production

EXPOSE 10000

CMD ["node", "src/index.js"]
