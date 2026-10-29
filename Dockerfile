FROM node:20-slim

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
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
    wget \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation de pnpm
RUN npm install -g pnpm@9.0.0

# Copie des fichiers de config workspace
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./

# Copie des package.json
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-ui/package.json ./packages/shared-ui/
COPY packages/testing/package.json ./packages/testing/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/screenapi/package.json ./apps/screenapi/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copie du code source des packages
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-config ./packages/shared-config
COPY packages/shared-ui ./packages/shared-ui
COPY packages/testing ./packages/testing
COPY packages/typescript-config ./packages/typescript-config

# Copie du code de l'app
COPY apps/screenapi ./apps/screenapi

# Prisma generate
RUN cd packages/database && pnpm exec prisma generate

# Install Playwright globally first
RUN npm install -g playwright@1.64.1

# Install Playwright browsers
RUN playwright install chromium --with-deps

# Build
RUN cd apps/screenapi && pnpm run build

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start
WORKDIR /app/apps/screenapi
CMD ["pnpm", "start"]
