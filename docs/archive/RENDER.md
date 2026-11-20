# Déploiement Render.com - SIMPLE ET STABLE ✅

Render.com est **stable**, **gratuit** et supporte Docker nativement.

## 🚀 DÉPLOIEMENT EN 3 ÉTAPES

### ÉTAPE 1: Créer un compte Render
1. Va sur **https://render.com**
2. Clique sur **"Get Started"**
3. Connecte-toi avec GitHub

### ÉTAPE 2: Déployer depuis GitHub
1. Sur le dashboard Render, clique **"New +"** → **"Blueprint"**
2. Connecte ton repo GitHub: **`Aguertil/screenapi`**
3. Render va détecter automatiquement le fichier `render.yaml`
4. Clique **"Apply"**

**RENDER VA AUTOMATIQUEMENT:**
- ✅ Créer la base PostgreSQL
- ✅ Créer le Redis
- ✅ Builder ton Docker
- ✅ Déployer l'app
- ✅ Connecter tous les services

### ÉTAPE 3: Configurer les variables d'environnement
Dans le dashboard de ton service web, va dans **"Environment"** et ajoute:

**OBLIGATOIRES:**
```
NEXTAUTH_URL = https://ton-app.onrender.com
```

**OPTIONNELS (OAuth):**
```
GOOGLE_CLIENT_ID = ton-client-id
GOOGLE_CLIENT_SECRET = ton-secret
GITHUB_CLIENT_ID = ton-client-id
GITHUB_CLIENT_SECRET = ton-secret
```

**OPTIONNELS (Stripe):**
```
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
```

**OPTIONNELS (Emails):**
```
RESEND_API_KEY = re_...
RESEND_FROM_EMAIL = noreply@ton-domaine.com
```

### ÉTAPE 4: Migrations de base de données
Une fois déployé, va dans **"Shell"** de ton service et lance:
```bash
cd packages/database
pnpm exec prisma migrate deploy
```

## ✅ C'EST EN LIGNE!

Ton URL sera: **https://screenapi.onrender.com** (ou le nom que tu as choisi)

---

## 📊 AVANTAGES RENDER

✅ **Gratuit**: 750 heures/mois gratuites  
✅ **PostgreSQL inclus**: Base de données gratuite  
✅ **Redis inclus**: Cache gratuit  
✅ **Docker natif**: Ton Dockerfile qui marche localement marche ici  
✅ **Auto-deploy**: Push sur GitHub = déploiement automatique  
✅ **SSL gratuit**: HTTPS automatique  
✅ **Logs en temps réel**: Debugging facile  
✅ **Stable**: Pas de downtime comme Railway

---

## 🔧 COMMANDES UTILES

### Voir les logs
Dashboard → Ton service → "Logs"

### Redéployer
Dashboard → Ton service → "Manual Deploy" → "Deploy latest commit"

### Shell / SSH
Dashboard → Ton service → "Shell"

### Scaler (si besoin)
Dashboard → Ton service → "Settings" → Change le plan

---

## 🐛 TROUBLESHOOTING

### Build échoue
Regarde les logs dans "Events". Si c'est une dépendance manquante, dis-moi.

### App crash au démarrage
Va dans "Shell" et teste:
```bash
cd apps/screenapi
pnpm start
```

### Base de données non accessible
Vérifie que `DATABASE_URL` est bien configurée dans "Environment".

---

## 💰 PRIX

- **Free**: 750h/mois (suffisant pour 1 app qui tourne H24)
- **Starter**: $7/mois (pas de sleep, plus rapide)
- **Pro**: $25/mois (plus de ressources)

Le plan gratuit dort après 15min d'inactivité (premier chargement = 30sec de réveil).

---

**C'EST TOUT!** Simple, stable, et ça marche. 🎉
