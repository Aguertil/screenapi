# 🚀 Déploiement Render - Guide Complet

## Étape par Étape (5 minutes)

### 1️⃣ Connecter votre Repository GitHub

1. Allez sur **https://dashboard.render.com**
2. Cliquez sur **"New +"** en haut à droite
3. Sélectionnez **"Blueprint"**
4. Connectez votre repository GitHub si ce n'est pas déjà fait
5. Sélectionnez ce repository: `tmp-56f5dda676a6a09c` (ou le nom que vous lui donnerez)
6. Cliquez sur **"Apply"**

### 2️⃣ Render va automatiquement créer:

✅ **Web Service** (screenapi-prod)
- Docker build automatique
- 2GB RAM (Standard plan)
- Region: Frankfurt (EU)
- Health checks configurés
- Auto-deploy sur push à `main`

✅ **PostgreSQL Database** (screenapi-db)
- 1GB storage
- Starter plan
- Connection string auto-injectée

✅ **Redis** (screenapi-redis) - Optionnel
- 256MB
- LRU eviction policy
- Connection string auto-injectée

### 3️⃣ Confirmation et Déploiement

1. **Vérifiez les services** créés dans le blueprint
2. Cliquez sur **"Create New Resources"**
3. Attendez ~10-15 minutes (premier build avec Playwright)
4. ✅ **C'est tout!** Votre API est déployée

---

## 🔗 URLs après déploiement

Render vous donnera automatiquement:

```
Service Web: https://screenapi-prod.onrender.com
Dashboard: https://screenapi-prod.onrender.com/dashboard
Docs: https://screenapi-prod.onrender.com/docs
Health: https://screenapi-prod.onrender.com/api/health
```

---

## 🧪 Tester votre Déploiement

### 1. Créer un utilisateur test

```bash
curl -X POST https://screenapi-prod.onrender.com/api/admin/setup
```

Vous recevrez:
```json
{
  "apiKey": {
    "key": "sk_test_xxxxx..."
  },
  "usage": {
    "curl": "..."
  }
}
```

### 2. Capturer votre première screenshot

```bash
curl -X POST https://screenapi-prod.onrender.com/api/v1/screenshot \
  -H "x-api-key: sk_test_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output screenshot.png
```

### 3. Vérifier le health

```bash
curl https://screenapi-prod.onrender.com/api/health
```

---

## ⚙️ Configuration Avancée

### Variables d'environnement (optionnel)

Si vous voulez ajouter des variables manuellement:

1. Allez dans **Settings** de votre service
2. **Environment** tab
3. Ajoutez:
   - `NODE_ENV` = `production` (déjà défini)
   - `DATABASE_URL` (auto-injecté)
   - `REDIS_URL` (auto-injecté)

### Scaling

**Plan Starter** (Free)
- ❌ Ne supporte pas Docker
- ❌ Pas assez de RAM pour Playwright

**Plan Standard** ($25/mois) ✅ RECOMMANDÉ
- ✅ 2GB RAM
- ✅ Docker support
- ✅ Auto-sleep après 15min d'inactivité
- ✅ Réveille automatiquement sur requête

**Plan Pro** ($85/mois)
- 4GB RAM
- Pas d'auto-sleep
- Meilleure performance

### Désactiver Redis (économie)

Si vous ne voulez pas payer Redis ($7/mois):

1. Éditez `render.yaml`
2. Commentez la section Redis:
```yaml
  # Redis is optional
  # - name: screenapi-redis
  #   type: redis
  #   ...
```
3. Push le changement
4. L'app utilisera le rate limiting en mémoire

---

## 💰 Coût Estimé

| Service | Plan | Prix/mois |
|---------|------|-----------|
| Web Service | Standard (2GB) | $25 |
| PostgreSQL | Starter (1GB) | $7 |
| Redis | Starter (256MB) | $7 |
| **Total** | | **~$39/mois** |

**Sans Redis:** ~$32/mois

**Note:** Render offre souvent des crédits pour nouveaux utilisateurs!

---

## 🔄 Déploiements Automatiques

### Chaque push sur `main`

Render déploie automatiquement:
1. Pull le code GitHub
2. Build Docker image
3. Run migrations (si configuré)
4. Deploy nouvelle version
5. Health check
6. Route le traffic

### Rollback

En cas de problème:
1. Dashboard → **Events**
2. Cliquez sur un déploiement précédent
3. **Rollback to this version**

---

## 🐛 Troubleshooting

### Build échoue

**Problème:** Docker build timeout ou erreur

**Solution:**
1. Vérifiez les logs dans Dashboard → **Logs**
2. Le premier build prend ~10-15min (Playwright)
3. Les builds suivants: ~5min (cache Docker)

### "Service Unavailable"

**Problème:** Service en auto-sleep (Standard plan)

**Solution:**
- Première requête après 15min d'inactivité prend ~30s
- Requêtes suivantes: rapides
- Upgrade vers Pro pour pas d'auto-sleep

### Database connection error

**Problème:** Cannot connect to PostgreSQL

**Solution:**
1. Vérifiez que DATABASE_URL est bien injecté
2. Dashboard → Settings → Environment
3. Vérifiez que la database est en état "Available"

### Playwright crashes

**Problème:** Browser crashes ou OOM

**Solution:**
- Upgrade vers Standard Plus (4GB) ou Pro (4-16GB)
- Dashboard → Settings → Instance Type

---

## 📊 Monitoring

### Logs en temps réel

```
Dashboard → Your Service → Logs
```

### Metrics

```
Dashboard → Your Service → Metrics
```

Vous verrez:
- CPU usage
- Memory usage
- Response times
- Request count

### Alertes

Configurez des alertes:
1. **Settings** → **Notifications**
2. Ajoutez votre email/Slack
3. Sélectionnez événements (deploy failed, high CPU, etc.)

---

## 🔐 Sécurité

### SSL/HTTPS

✅ Automatique! Render fournit SSL gratuit pour tous les services.

### IP Allowlist (Database)

Pour restreindre l'accès à la base:

1. Dashboard → Database → **Settings**
2. **Access Control**
3. Ajoutez les IPs autorisées
4. Laissez vide pour "Allow All"

### Secrets

Ne mettez JAMAIS de secrets dans le code:
- DATABASE_URL: ✅ Auto-injecté
- API keys externes: Ajoutez dans Environment Variables

---

## 🚀 Optimisations

### Cache Docker

Render cache les layers Docker entre builds:
- Premier build: ~15min
- Builds suivants: ~5min

### CDN

Render inclut un CDN global automatique:
- Assets statiques: cachés
- API responses: pas cachés (dynamic)

### Database Connection Pooling

Déjà configuré dans Prisma:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Render PostgreSQL inclut PgBouncer par défaut.

---

## 📝 Checklist Pré-Production

Avant de passer en production:

- [ ] Tester tous les endpoints
- [ ] Vérifier health check
- [ ] Tester capture screenshot
- [ ] Vérifier les logs
- [ ] Configurer alertes
- [ ] Tester rate limiting
- [ ] Vérifier SSRF protection
- [ ] Backup database (automatique sur Render)
- [ ] Documenter les URLs
- [ ] Communiquer aux utilisateurs

---

## 🎯 Prochaines Étapes

Après déploiement réussi:

1. **Configurer domaine custom** (optionnel)
   - Settings → Custom Domain
   - Ajoutez: `api.votre-domaine.com`
   - Configurez DNS (CNAME)

2. **Activer Render Disks** (persistance)
   - Pour stocker screenshots localement
   - Settings → Disks → Add Disk

3. **Setup monitoring externe**
   - Sentry pour errors
   - DataDog pour metrics
   - UptimeRobot pour uptime

4. **Désactiver `/api/admin/setup` en prod**
   - Déjà protégé par `NODE_ENV=production`

---

## ❓ Besoin d'Aide?

- **Render Docs:** https://render.com/docs
- **Render Support:** support@render.com
- **Community:** https://community.render.com

---

## 🎉 C'est Parti!

1. Push votre code sur GitHub (déjà fait ✅)
2. Allez sur https://dashboard.render.com
3. New + → Blueprint
4. Sélectionnez votre repo
5. Apply
6. Attendez 10-15min
7. Testez avec curl
8. 🚀 **Vous êtes live!**

---

**Coût:** ~$39/mois ($32 sans Redis)  
**Setup time:** ~15 minutes  
**Maintenance:** Automatique  
**Scaling:** Click pour upgrade  

**Bon déploiement! 🚀**
