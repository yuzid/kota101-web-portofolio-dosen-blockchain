# server/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
RUN npx prisma generate && npm run build

# Build frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/client/dist ./client/dist
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]