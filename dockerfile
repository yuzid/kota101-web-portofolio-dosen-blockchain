# === STAGE 1: Build Frontend ===
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./

# WAJIB DITAMBAHKAN: Menerima argument dari GitHub Actions CI/CD
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL

# WAJIB DITAMBAHKAN: Mengubah argument menjadi environment variable agar terbaca oleh Vite saat build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL

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
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]