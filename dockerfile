# === STAGE 1: Build Frontend ===
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# === STAGE 2: Build & Run Backend Server ===
FROM node:20-alpine
WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

WORKDIR /app/server

RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npx prisma generate
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# ← DIUBAH: tambahkan prisma db seed setelah migrate
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/server.js"]