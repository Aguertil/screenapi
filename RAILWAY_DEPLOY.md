# Déploiement Railway - 3 CLICS ✅

Railway est 100x plus simple que Vercel ou Fly.io.

## 🚀 Déploiement (2 minutes)

### 1. Va sur https://railway.app

### 2. Clique sur "Start a New Project"

### 3. Clique sur "Deploy from GitHub repo"

### 4. Choisis `Aguertil/screenapi`

### 5. Railway va automatiquement:
- ✅ Détecter que c'est un projet pnpm
- ✅ Installer les dépendances
- ✅ Builder l'app
- ✅ La déployer

### 6. Ajoute les services:
- **PostgreSQL**: Clique sur "+ New" → "Database" → "PostgreSQL"
- **Redis**: Clique sur "+ New" → "Database" → "Redis"

### 7. Variables d'environnement (Settings → Variables):

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
NEXTAUTH_SECRET=génère-avec-openssl-rand-base64-32
NEXTAUTH_URL=https://ton-app.up.railway.app
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...
STRIPE_SECRET_KEY=...
RESEND_API_KEY=...
```

### 8. Déployer:
Clique sur "Deploy"

**C'EST TOUT!** 🎉

Pas de CLI, pas de Dockerfile, pas de prise de tête.

---

## Prix

- **Gratuit**: $5 de crédit par mois (largement suffisant pour tester)
- **Pro**: $20/mois illimité

## Avantages vs les autres

✅ Plus simple que Vercel (pas de problème pnpm)  
✅ Plus simple que Fly.io (pas de Dockerfile)  
✅ PostgreSQL + Redis inclus  
✅ Logs en temps réel  
✅ Redéploiement auto sur git push  
✅ Support Playwright natif
