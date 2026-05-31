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

# Install dependency backend
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy source code backend & hasil build frontend
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# Compile TypeScript backend ke JavaScript
WORKDIR /app/server
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.js"]