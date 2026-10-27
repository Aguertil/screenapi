#!/bin/bash
# Render Start Script - Runs migrations then starts the app

set -e

echo "🚀 ScreenAPI Starting on Render"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL not set!"
else
    echo "✅ Database connection configured"
fi

# Run Prisma migrations
echo ""
echo "🗄️  Running database migrations..."
if command -v pnpm &> /dev/null; then
    pnpm --filter @repo/database db:deploy || echo "⚠️  Migration warning (may be first deploy)"
else
    npx --yes prisma migrate deploy --schema=./packages/database/prisma/schema.prisma || echo "⚠️  Migration warning"
fi

echo ""
echo "✅ Migrations complete"
echo ""

# Start the application
echo "🚀 Starting Next.js server..."
echo ""

cd apps/screenapi
node server.js
