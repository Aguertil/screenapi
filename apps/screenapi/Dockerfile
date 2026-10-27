# Build stage
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/screenapi ./apps/screenapi

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter @repo/database db:generate

# Build the application
RUN pnpm --filter screenapi build

# Production stage
FROM node:20-slim AS runner

# Install dependencies for Playwright
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
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/screenapi/.next/standalone ./
COPY --from=builder /app/apps/screenapi/.next/static ./apps/screenapi/.next/static
COPY --from=builder /app/apps/screenapi/public ./apps/screenapi/public
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Install Playwright browsers
RUN npx playwright-core install chromium --with-deps

# Set environment
ENV NODE_ENV=production
ENV PORT=43210

EXPOSE 43210

# Start the application
CMD ["node", "apps/screenapi/server.js"]
