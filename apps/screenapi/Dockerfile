# Build stage
FROM node:20-slim AS builder

# Install dependencies
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy all workspace files
COPY . .

# Install dependencies
RUN pnpm install

# Generate Prisma Client
RUN pnpm --filter @repo/database db:generate

# Build the application
RUN pnpm --filter screenapi build

# Production stage
FROM node:20-slim AS runner

# Install Playwright dependencies
RUN apt-get update -y && \
    apt-get install -y \
    openssl \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/turbo.json ./turbo.json

# Copy packages
COPY --from=builder /app/packages ./packages

# Copy built Next.js app
COPY --from=builder /app/apps/screenapi/.next ./apps/screenapi/.next
COPY --from=builder /app/apps/screenapi/public ./apps/screenapi/public
COPY --from=builder /app/apps/screenapi/package.json ./apps/screenapi/package.json
COPY --from=builder /app/apps/screenapi/next.config.ts ./apps/screenapi/next.config.ts

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

# Install Playwright Chromium
RUN npx playwright-core install chromium --with-deps

# Set environment
ENV NODE_ENV=production
ENV PORT=43210

EXPOSE 43210

# Start the application
WORKDIR /app/apps/screenapi
CMD ["npx", "next", "start", "-p", "43210"]
