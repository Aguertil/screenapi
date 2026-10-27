#!/bin/bash
# Render Build Script (if needed for debugging)

set -e

echo "🏗️  Render Build Started"
echo "======================="
echo ""

echo "📦 Node version:"
node --version
echo ""

echo "📦 NPM version:"
npm --version
echo ""

echo "🔧 Installing pnpm..."
npm install -g pnpm@latest
echo ""

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile
echo ""

echo "🗄️  Generating Prisma Client..."
pnpm --filter @repo/database db:generate
echo ""

echo "🏗️  Building application..."
pnpm --filter screenapi build
echo ""

echo "✅ Build Complete!"
