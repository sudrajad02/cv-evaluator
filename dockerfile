# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# 1. Copy package files
COPY package.json ./

# 2. Install dependencies
RUN npm install

# 3. Copy HANYA yang diperlukan (sesuai tsconfig.json)
COPY src/ ./src/
COPY tsconfig.json ./

# 4. Build project
RUN npm run build

# Stage 2: Run
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/app.js"]