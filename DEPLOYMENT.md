# 🚀 ScreenAPI Deployment Guide

This guide covers deploying ScreenAPI to various platforms.

---

## Prerequisites

- Node.js 20+
- Docker (for Fly.io/Railway)
- PostgreSQL database
- Redis (optional, falls back to in-memory)

---

## Option 1: Fly.io (Recommended) ⭐

**Best for:** Full control, Docker support, Playwright compatibility

### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io

```bash
fly auth login
```

### 3. Create PostgreSQL Database

```bash
fly postgres create --name screenapi-db --region cdg
```

Save the connection string.

### 4. Create Redis (Optional)

```bash
fly redis create --name screenapi-redis --region cdg
```

### 5. Create App

```bash
fly launch --no-deploy

# When prompted:
# - App name: screenapi-prod (or your choice)
# - Region: cdg (Paris) or your preference
# - PostgreSQL: Skip (already created)
# - Redis: Skip (already created)
```

### 6. Set Secrets

```bash
fly secrets set DATABASE_URL="postgresql://username:password@hostname:5432/database"
fly secrets set REDIS_URL="redis://default:password@hostname:6379"
```

### 7. Deploy

```bash
fly deploy
```

### 8. Open App

```bash
fly open
```

### 9. Scale (Optional)

```bash
# Add more memory
fly scale memory 4096

# Add more CPUs
fly scale vm shared-cpu-4x

# Add more regions
fly regions add ams fra
```

---

## Option 2: Railway

**Best for:** Easy setup, no configuration

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login

```bash
railway login
```

### 3. Initialize Project

```bash
railway init
```

### 4. Add PostgreSQL

```bash
railway add --plugin postgresql
```

### 5. Add Redis (Optional)

```bash
railway add --plugin redis
```

### 6. Set Environment Variables

```bash
railway variables set NODE_ENV=production
```

### 7. Deploy

```bash
railway up
```

### 8. Open App

```bash
railway open
```

---

## Option 3: Render

**Best for:** Simple deployment

### 1. Create New Web Service

Go to https://render.com and click "New Web Service"

### 2. Connect Repository

Connect your GitHub repository

### 3. Configure

- **Name:** screenapi-prod
- **Environment:** Docker
- **Dockerfile Path:** apps/screenapi/Dockerfile
- **Instance Type:** Standard (2GB RAM minimum)

### 4. Add PostgreSQL

Click "New" → "PostgreSQL"

### 5. Environment Variables

```
DATABASE_URL=<from PostgreSQL>
REDIS_URL=<optional>
NODE_ENV=production
PORT=43210
```

### 6. Deploy

Click "Create Web Service"

---

## Option 4: Vercel ⚠️

**Note:** Vercel has serverless limitations that may affect Playwright. Not recommended for production screenshots.

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Add Database

Use Vercel Postgres or external PostgreSQL (Neon, Supabase)

### 4. Set Environment Variables

```bash
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
```

### 5. Deploy

```bash
vercel --prod
```

---

## Environment Variables Reference

### Required

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
NODE_ENV="production"
```

### Optional

```bash
REDIS_URL="redis://default:pass@host:6379"
PORT="43210"
```

---

## Post-Deployment

### 1. Run Database Migrations

```bash
# Fly.io
fly ssh console -C "cd /app && npx prisma migrate deploy"

# Railway
railway run npx prisma migrate deploy

# Or manually
npx prisma migrate deploy
```

### 2. Create First User

```bash
curl -X POST https://your-app.fly.dev/api/admin/setup
```

### 3. Test Screenshot

```bash
curl -X POST https://your-app.fly.dev/api/v1/screenshot \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output screenshot.png
```

### 4. Monitor Health

```bash
curl https://your-app.fly.dev/api/health
```

---

## Performance Tuning

### Fly.io

```bash
# Scale memory
fly scale memory 4096

# Add CPUs
fly scale vm shared-cpu-4x

# Multiple regions
fly regions add ams fra lhr

# Auto-scaling
fly autoscale set min=1 max=5
```

### Railway

Railway auto-scales based on traffic.

### Render

Upgrade to "Standard Plus" or "Pro" for better performance.

---

## Monitoring

### Logs

```bash
# Fly.io
fly logs

# Railway
railway logs

# Render
Check dashboard
```

### Metrics

```bash
# Fly.io
fly dashboard
```

---

## Troubleshooting

### Playwright Issues

**Problem:** Browser crashes or timeouts

**Solution:**
- Increase memory to 4GB+
- Increase CPU to 2+
- Check Dockerfile has all required dependencies

### Database Connection

**Problem:** Cannot connect to database

**Solution:**
- Verify DATABASE_URL is correct
- Check firewall rules
- Ensure database is in same region

### Redis Connection

**Problem:** Redis unavailable

**Solution:**
- App uses in-memory fallback automatically
- Check REDIS_URL is correct
- Redis is optional

---

## Cost Estimation

### Fly.io (Recommended)

- **App:** ~$10-30/month (2GB RAM, shared CPU)
- **PostgreSQL:** ~$15/month (1GB)
- **Redis:** ~$5/month (256MB)
- **Total:** ~$30-50/month

### Railway

- **App + DB + Redis:** ~$20-40/month
- Pay-as-you-go pricing

### Render

- **Standard:** $25/month (2GB RAM)
- **PostgreSQL:** Free (500MB) or $7/month (1GB)
- **Redis:** Not included (use external)
- **Total:** ~$32-40/month

---

## Security Checklist

Before deploying to production:

- [ ] Set strong DATABASE_URL credentials
- [ ] Enable SSL for database connection
- [ ] Set NODE_ENV=production
- [ ] Remove /api/admin/setup in production
- [ ] Configure CORS if needed
- [ ] Set up monitoring/alerts
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up backups
- [ ] Enable logging

---

## Scaling Recommendations

### < 1,000 screenshots/day
- 2GB RAM, 1 CPU
- Single region
- Basic PostgreSQL

### 1,000 - 10,000 screenshots/day
- 4GB RAM, 2 CPUs
- Multiple regions
- Connection pooling
- Redis caching

### 10,000+ screenshots/day
- 8GB+ RAM, 4+ CPUs
- Auto-scaling (min=2, max=10)
- Read replicas
- CDN for static assets
- Redis cluster

---

## Next Steps

1. Choose your platform (Fly.io recommended)
2. Set up database and Redis
3. Configure environment variables
4. Deploy application
5. Run migrations
6. Create test user
7. Test screenshot capture
8. Monitor health and logs
9. Scale as needed

---

**Need help?** Check the logs or open an issue!

🚀 **Happy deploying!**
