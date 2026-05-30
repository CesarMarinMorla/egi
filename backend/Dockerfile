FROM node:20-alpine

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

USER app

EXPOSE 3001

CMD ["node", "src/index.js"]
