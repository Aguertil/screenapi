#!/bin/bash

# ScreenAPI Fly.io Deployment Script

set -e

echo "🚀 ScreenAPI Deployment to Fly.io"
echo "=================================="
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not installed"
    echo "📦 Installing Fly CLI..."
    curl -L https://fly.io/install.sh | sh
    export FLYCTL_INSTALL="/home/ubuntu/.fly"
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "🔐 Please login to Fly.io"
    fly auth login
fi

echo ""
echo "📋 Configuration"
echo "---------------"
read -p "App name [screenapi-prod]: " APP_NAME
APP_NAME=${APP_NAME:-screenapi-prod}

read -p "Region [cdg (Paris)]: " REGION
REGION=${REGION:-cdg}

echo ""
echo "🗄️  Database Setup"
echo "----------------"
read -p "Create new PostgreSQL database? (y/n) [y]: " CREATE_DB
CREATE_DB=${CREATE_DB:-y}

if [[ "$CREATE_DB" == "y" ]]; then
    DB_NAME="${APP_NAME}-db"
    echo "Creating database: $DB_NAME"
    fly postgres create --name "$DB_NAME" --region "$REGION" || true
    echo ""
    echo "⚠️  Save the DATABASE_URL from above!"
    echo ""
fi

read -p "Enter DATABASE_URL: " DATABASE_URL

echo ""
echo "🔴 Redis Setup (Optional)"
echo "------------------------"
read -p "Create Redis instance? (y/n) [n]: " CREATE_REDIS
CREATE_REDIS=${CREATE_REDIS:-n}

REDIS_URL=""
if [[ "$CREATE_REDIS" == "y" ]]; then
    REDIS_NAME="${APP_NAME}-redis"
    echo "Creating Redis: $REDIS_NAME"
    fly redis create --name "$REDIS_NAME" --region "$REGION" || true
    echo ""
    read -p "Enter REDIS_URL (or press Enter to skip): " REDIS_URL
fi

echo ""
echo "🚀 Creating App"
echo "--------------"
fly launch --name "$APP_NAME" --region "$REGION" --no-deploy --copy-config

echo ""
echo "🔐 Setting Secrets"
echo "-----------------"
fly secrets set DATABASE_URL="$DATABASE_URL" --app "$APP_NAME"

if [[ -n "$REDIS_URL" ]]; then
    fly secrets set REDIS_URL="$REDIS_URL" --app "$APP_NAME"
fi

echo ""
echo "🏗️  Building and Deploying"
echo "-------------------------"
fly deploy --app "$APP_NAME"

echo ""
echo "🗄️  Running Database Migrations"
echo "------------------------------"
fly ssh console --app "$APP_NAME" -C "cd /app && npx prisma migrate deploy"

echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "🌐 Your app is live at: https://${APP_NAME}.fly.dev"
echo ""
echo "📝 Next steps:"
echo "1. Create test user:"
echo "   curl -X POST https://${APP_NAME}.fly.dev/api/admin/setup"
echo ""
echo "2. Check health:"
echo "   curl https://${APP_NAME}.fly.dev/api/health"
echo ""
echo "3. View dashboard:"
echo "   https://${APP_NAME}.fly.dev/dashboard"
echo ""
echo "4. View logs:"
echo "   fly logs --app $APP_NAME"
echo ""
echo "🎉 Happy screenshotting!"
