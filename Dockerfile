FROM node:20-slim AS builder

WORKDIR /app

# Copy package definitions
COPY package.json ./
COPY node-backend/package*.json ./node-backend/
COPY react-frontend/package*.json ./react-frontend/

# Install dependencies in Linux
RUN npm --prefix node-backend install
RUN npm --prefix react-frontend install

# Copy source files
COPY node-backend/src ./node-backend/src
COPY react-frontend ./react-frontend

# Build frontend
RUN npm --prefix react-frontend run build

# Copy dist to node-backend/public as direct fallback
RUN cp -r /app/react-frontend/dist /app/node-backend/public

# Runner stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node-backend ./node-backend
COPY --from=builder /app/react-frontend/dist ./react-frontend/dist

EXPOSE 10000

CMD ["node", "node-backend/src/server.js"]
