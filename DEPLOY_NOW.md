# 🚀 DÉPLOYER MAINTENANT SUR RENDER

## ⏱️ 5 Minutes pour Déployer

### 📋 Ce dont vous avez besoin:
- ✅ Compte Render (gratuit): https://dashboard.render.com/register
- ✅ GitHub connecté à Render (déjà fait ✅)
- ✅ Ce repository sur GitHub

---

## 🎯 3 ÉTAPES SEULEMENT

### 1️⃣ Créer depuis Blueprint (2 minutes)

1. Allez sur: **https://dashboard.render.com/select-repo?type=blueprint**

2. **Sélectionnez votre repository** dans la liste

3. **Cliquez "Apply"** - Render va automatiquement:
   - ✅ Créer le web service (ScreenAPI)
   - ✅ Créer PostgreSQL database
   - ✅ Créer Redis (optionnel)
   - ✅ Configurer toutes les variables d'environnement
   - ✅ Lancer le premier build

### 2️⃣ Choisir les Plans (1 minute)

Render vous demande de confirmer:

**Web Service:**
- Plan: **Standard** ($25/mois)
- Region: **Frankfurt** (EU)
- ✅ Cliquez "Create"

**PostgreSQL:**
- Plan: **Starter** ($7/mois)
- Region: **Frankfurt**
- ✅ Cliquez "Create"

**Redis** (optionnel):
- Plan: **Starter** ($7/mois) - ou skip si vous voulez économiser
- Region: **Frankfurt**
- ✅ Cliquez "Create" (ou "Skip")

💰 **Total: $32-39/mois**

### 3️⃣ Attendre le Déploiement (10-15 minutes)

Render va:
1. 🏗️ Build Docker image (~10min premier build)
2. 🐘 Initialiser PostgreSQL (~2min)
3. 🔴 Initialiser Redis (~1min)
4. 🚀 Déployer l'application (~2min)
5. ✅ Health check

Vous verrez "Live" en vert quand c'est prêt! 🎉

---

## ✅ TESTER VOTRE API

Une fois déployé, Render vous donne l'URL:
```
https://screenapi-prod.onrender.com
```

### Test 1: Health Check
```bash
curl https://screenapi-prod.onrender.com/api/health
```

Vous devriez voir:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "playwright": { "status": "ok" }
  }
}
```

### Test 2: Créer un Utilisateur Test
```bash
curl -X POST https://screenapi-prod.onrender.com/api/admin/setup
```

Vous recevrez une API key: `sk_test_xxxxx...`

### Test 3: Capturer votre Première Screenshot! 📸
```bash
curl -X POST https://screenapi-prod.onrender.com/api/v1/screenshot \
  -H "x-api-key: sk_test_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output screenshot.png
```

**Ouvrez `screenshot.png` - ça fonctionne! 🎉**

---

## 🎯 URLs Importantes

| Page | URL |
|------|-----|
| **Homepage** | https://screenapi-prod.onrender.com |
| **Dashboard** | https://screenapi-prod.onrender.com/dashboard |
| **Documentation** | https://screenapi-prod.onrender.com/docs |
| **Health Check** | https://screenapi-prod.onrender.com/api/health |
| **Render Dashboard** | https://dashboard.render.com |

---

## 💡 Conseils

### Si le premier déploiement échoue:

1. **Vérifiez les logs**: Dashboard → Your Service → Logs
2. **Problème fréquent**: Build timeout
   - Solution: Render va retry automatiquement
   - Le premier build prend ~15min (Playwright)
3. **Contact support**: support@render.com (très réactif)

### Économiser de l'argent:

**Sans Redis** ($32/mois au lieu de $39):
1. Éditez `render.yaml`
2. Commentez la section Redis
3. Push sur GitHub
4. Render redéploie automatiquement
5. L'app utilise le rate limiting en mémoire ✅

### Auto-déploiement:

✅ **Déjà configuré!** Chaque `git push` sur `main` déclenche un déploiement automatique.

---

## 📊 Monitoring

Dashboard Render vous montre:
- 📈 CPU Usage
- 💾 Memory Usage  
- 🌐 Request Count
- ⏱️ Response Times
- 📝 Logs en temps réel

---

## 🔐 Sécurité

✅ **Automatique sur Render:**
- SSL/HTTPS (certificat gratuit)
- DATABASE_URL sécurisé (injecté, pas dans le code)
- Firewall configuré
- Backups PostgreSQL quotidiens
- DDoS protection

---

## 🎉 C'EST TOUT!

1. ➡️ https://dashboard.render.com/select-repo?type=blueprint
2. ➡️ Sélectionnez votre repo
3. ➡️ Apply
4. ➡️ Attendez 15min ☕
5. ✅ **C'EST LIVE!**

---

## 📞 Support

- 📧 **Render Support**: support@render.com
- 📚 **Docs**: https://render.com/docs
- 💬 **Community**: https://community.render.com
- 📖 **Guide détaillé**: Voir `RENDER_DEPLOY.md`

---

**Temps total: ~20 minutes**  
**Difficulté: ⭐️ Facile**  
**Coût: $32-39/mois**

**🚀 Bon déploiement!**
