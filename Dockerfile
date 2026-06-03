# Stage 1: Install dependencies
FROM node:18-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the Next.js application
FROM node:18-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runtime
FROM node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Copy standalone server + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy sql.js WASM file (needed at runtime)
COPY --from=builder /app/node_modules/sql.js ./node_modules/sql.js

# Copy startup script
COPY start.js ./start.js

# Create data directory
RUN mkdir -p /data/documents

EXPOSE 3000

CMD ["node", "start.js"]
