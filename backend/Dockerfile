FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node dist/main"]
