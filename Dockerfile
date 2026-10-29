# Dockerfile simple pour Railway
FROM node:20-bookworm-slim

# Installation des dépendances système pour Playwright
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
    xdg-utils \
    wget \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation de pnpm
RUN npm install -g pnpm@9.0.0

# Copie des fichiers de configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copie des package.json de tous les packages
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-ui/package.json ./packages/shared-ui/
COPY packages/testing/package.json ./packages/testing/
COPY apps/screenapi/package.json ./apps/screenapi/

# Installation des dépendances
RUN pnpm install --frozen-lockfile

# Copie du code source
COPY . .

# Génération du client Prisma
RUN cd packages/database && pnpm exec prisma generate

# Installation de Playwright
RUN pnpm exec playwright install chromium --with-deps

# Build de l'application
RUN cd apps/screenapi && pnpm run build

# Exposition du port
EXPOSE 3000

# Démarrage
CMD ["sh", "-c", "cd apps/screenapi && pnpm start"]
