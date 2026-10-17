FROM node:20-alpine

WORKDIR /app

# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000

# Apply pending migrations, then start the dev server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
