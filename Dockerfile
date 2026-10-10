FROM node:20-alpine

WORKDIR /app

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN npm config set strict-ssl false

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma || true

EXPOSE 5000

CMD ["npm","run","dev"]
