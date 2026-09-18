# Multi-stage build for Node.js + React.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and subfolder package definitions
COPY package.json ./
COPY node-backend/package*.json ./node-backend/
COPY react-frontend/package*.json ./react-frontend/

# Install dependencies
RUN npm --prefix node-backend install
RUN npm --prefix react-frontend install

# Copy source code
COPY node-backend ./node-backend
COPY react-frontend ./react-frontend

# Build React frontend
RUN npm --prefix react-frontend run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node-backend ./node-backend
COPY --from=builder /app/react-frontend/dist ./react-frontend/dist

EXPOSE 10000

CMD ["node", "node-backend/src/server.js"]
