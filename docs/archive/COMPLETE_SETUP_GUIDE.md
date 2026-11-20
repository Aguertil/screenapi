# 🚀 ScreenAPI - Guide de Configuration Complet

**Tout ce dont vous avez besoin pour mettre en ligne votre SaaS professionnel**

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités](#fonctionnalités)
3. [Installation Locale](#installation-locale)
4. [Configuration des Services](#configuration-des-services)
5. [Déploiement](#déploiement)
6. [Tests](#tests)
7. [Maintenance](#maintenance)

---

## 🎯 Vue d'ensemble

ScreenAPI est maintenant une **plateforme SaaS complète** avec:

- ✅ Authentification multi-provider (Google, GitHub, Email/Password)
- ✅ Paiements Stripe (Free, Pro, Enterprise)
- ✅ Système de codes promo
- ✅ Dashboard utilisateur complet
- ✅ Gestion des API keys
- ✅ Emails transactionnels
- ✅ 20+ device presets (iPhone, Samsung, etc.)
- ✅ Web scraping API
- ✅ Documentation interactive

**Stack Technique:**
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Auth:** NextAuth.js v4
- **Paiements:** Stripe
- **Emails:** Resend
- **Database:** PostgreSQL
- **Cache:** Redis
- **Browser:** Playwright

---

## ✨ Fonctionnalités

### 🔐 Authentification

**3 méthodes de connexion:**
- **Email/Password** - Inscription classique avec bcrypt
- **Google OAuth** - Connexion avec compte Google
- **GitHub OAuth** - Connexion avec compte GitHub

**Pages:**
- `/auth/signin` - Connexion
- `/auth/signup` - Inscription
- Protection automatique des routes privées

### 💳 Paiements Stripe

**3 plans:**
| Plan | Prix | Screenshots | Scraping | Rate Limit |
|------|------|-------------|----------|------------|
| Free | $0/mois | 100/jour | 50/jour | 10/min |
| Pro | $49/mois | 10,000/jour | 5,000/jour | 100/min |
| Enterprise | $299/mois | Illimité | Illimité | Custom |

**Fonctionnalités:**
- Checkout Stripe sécurisé
- Webhooks pour synchronisation auto
- Gestion des abonnements
- Historique des paiements
- Portail client Stripe
- Support des codes promo

### 🎟️ Codes Promo

**3 types:**
- **PERCENTAGE** - Réduction en % (ex: -20%)
- **FIXED_AMOUNT** - Montant fixe (ex: -$10)
- **FREE_CREDITS** - Crédits gratuits

**Fonctionnalités:**
- Validation au checkout
- Limite d'utilisation
- Date d'expiration
- Tracking des usages

### 📊 Dashboard Utilisateur

**Statistiques en temps réel:**
- Usage du jour (total, réussis, échoués)
- Usage du mois
- Crédits restants avec barre de progression
- Graphiques des 7 derniers jours

**Gestion des API Keys:**
- Créer des clés
- Activer/désactiver
- Copier au clipboard
- Supprimer
- Voir dernière utilisation

**Quick Actions:**
- Upgrade de plan
- Manage billing (Stripe portal)
- Liens vers Playground, Docs, Pricing

### ⚙️ Account Settings

**Profil:**
- Modifier le nom
- Email (non modifiable)

**Sécurité:**
- Changer le mot de passe (email/password uniquement)
- OAuth users ne peuvent pas changer le mot de passe

**Billing:**
- Portail Stripe (gérer carte, factures, annuler)

**Danger Zone:**
- Supprimer le compte (avec double confirmation)
- Annule les abonnements Stripe automatiquement

### 📧 Emails Transactionnels

**4 types d'emails automatiques:**

1. **Email de Bienvenue** - À l'inscription
   - Message de bienvenue
   - Liste des features FREE
   - Liens dashboard, playground, docs
   - Call-to-action "Go to Dashboard"

2. **Paiement Réussi** - Après checkout Stripe
   - Confirmation du paiement
   - Détails du plan activé
   - Nouvelles limites
   - Lien dashboard

3. **Paiement Échoué** - Si paiement décliné
   - Message d'erreur
   - Raison du refus
   - Bouton "Update Payment Method"

4. **Annulation d'Abonnement**
   - Confirmation de l'annulation
   - Détails du plan FREE
   - Invitation à revenir

**Provider:** Resend (100 emails/jour gratuits)

### 📸 Screenshot API

**Device Presets (20+):**
- iPhones: 15 Pro Max, 15 Pro, 14 Pro Max, 14, 13, 12, SE
- Android: Galaxy S24 Ultra, S23, A54, Pixel 8 Pro, Pixel 7
- Tablets: iPad Pro 12.9", iPad Air, Galaxy Tab S9
- Desktop: 1920x1080, 2560x1440, MacBook Pro 16"

**Formats:** PNG, JPEG, WEBP

**Options:**
- Full page capture
- Custom viewports
- Wait for selectors
- Hide elements
- Block cookies/ads

### 🕷️ Web Scraping API

**Extraction de données:**
- Métadonnées (title, description, keywords)
- Open Graph tags (Facebook, LinkedIn)
- Twitter Cards
- Contenu textuel (full page ou sélecteur)
- Tous les liens
- Toutes les images

### 🎮 Playground Interactif

**2 onglets:**
1. **Screenshots** - Test des captures
   - Sélecteur de device
   - Choix du format
   - Full page option
   - Preview immédiate
   - Téléchargement

2. **Web Scraping** - Test du scraping
   - Checkboxes pour choisir les données
   - Affichage JSON formaté
   - Copie rapide

---

## 💻 Installation Locale

### Prérequis

- Node.js 20+
- Docker & Docker Compose
- Git (optionnel)

### Télécharger le Code

**Option 1: Depuis GitHub (recommandé)**
```powershell
# Via GitHub Desktop ou téléchargement ZIP
https://github.com/Aguertil/screenapi/archive/refs/heads/main.zip
```

**Option 2: Avec Git**
```bash
git clone https://github.com/Aguertil/screenapi.git
cd screenapi
```

### Configuration

**1. Créer `apps/screenapi/.env.local`:**

```env
# Database
DATABASE_URL="postgresql://screenapi:screenapi_dev_password@postgres:5432/screenapi"

# Redis
REDIS_URL="redis://redis:6379"

# Node
NODE_ENV="development"

# NextAuth
NEXTAUTH_URL="http://localhost:43210"
NEXTAUTH_SECRET="votre-secret-genere-avec-openssl"

# OAuth (optionnel en dev)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Stripe (optionnel en dev)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRO_PRICE_ID=""
STRIPE_ENTERPRISE_PRICE_ID=""

# Emails (optionnel en dev)
RESEND_API_KEY=""
FROM_EMAIL="onboarding@resend.dev"

# App
NEXT_PUBLIC_API_URL="http://localhost:43210"
```

**2. Générer NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Lancer l'Application

```powershell
cd screenapi
docker-compose up --build
```

**Accéder à:**
- **App:** http://localhost:43210
- **Dashboard:** http://localhost:43210/dashboard
- **Playground:** http://localhost:43210/playground
- **Docs:** http://localhost:43210/docs
- **PgAdmin:** http://localhost:5050 (admin@screenapi.local / admin)

---

## 🔧 Configuration des Services

### 1️⃣ Google OAuth

**Suivez:** `SETUP_AUTHENTICATION.md` section "Configurer Google OAuth"

**Quick steps:**
1. https://console.cloud.google.com
2. Create OAuth credentials
3. Add redirect URI: `http://localhost:43210/api/auth/callback/google`
4. Copy Client ID & Secret
5. Add to `.env.local`

### 2️⃣ GitHub OAuth

**Suivez:** `SETUP_AUTHENTICATION.md` section "Configurer GitHub OAuth"

**Quick steps:**
1. https://github.com/settings/developers
2. New OAuth App
3. Callback URL: `http://localhost:43210/api/auth/callback/github`
4. Copy Client ID & Secret
5. Add to `.env.local`

### 3️⃣ Stripe

**Suivez:** `SETUP_AUTHENTICATION.md` section "Configurer Stripe"

**Quick steps:**
1. https://dashboard.stripe.com/register
2. Get API keys (test mode)
3. Create 2 products (Pro $49, Enterprise $299)
4. Setup webhook endpoint
5. Install Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to http://localhost:43210/api/webhooks/stripe
   ```

### 4️⃣ Resend (Emails)

**Suivez:** `SETUP_EMAILS.md`

**Quick steps:**
1. https://resend.com
2. Create account
3. Get API key
4. Add to `.env.local`:
   ```env
   RESEND_API_KEY="re_..."
   FROM_EMAIL="onboarding@resend.dev"
   ```

### 5️⃣ Codes Promo

**Créer via Prisma Studio:**
```bash
pnpm --filter @repo/database studio
```

**Exemples:**
```json
// 20% de réduction
{
  "code": "LAUNCH20",
  "type": "PERCENTAGE",
  "value": 20,
  "maxUses": 100,
  "isActive": true
}

// $10 de réduction
{
  "code": "SAVE10",
  "type": "FIXED_AMOUNT",
  "value": 1000,
  "maxUses": 50,
  "isActive": true
}

// 1000 crédits gratuits
{
  "code": "FREE1000",
  "type": "FREE_CREDITS",
  "value": 1000,
  "isActive": true
}
```

---

## 🌐 Déploiement

### Option 1: Vercel (Recommandé pour Next.js)

**1. Préparer la base de données:**

Utilisez un service PostgreSQL:
- **Vercel Postgres** (intégré)
- **Neon** (gratuit, serverless)
- **Supabase** (gratuit)
- **Railway** (payant)

**2. Déployer sur Vercel:**

```bash
# Installer Vercel CLI
npm i -g vercel

# Deploy
cd screenapi
vercel

# Ou via GitHub:
# 1. Push sur GitHub
# 2. Connecter le repo dans Vercel Dashboard
# 3. Auto-deploy sur chaque push
```

**3. Ajouter les variables d'environnement:**

Dans Vercel Dashboard → Settings → Environment Variables:
- `DATABASE_URL`
- `REDIS_URL` (Upstash Redis gratuit)
- `NEXTAUTH_URL` (votre domaine)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `STRIPE_SECRET_KEY` (mode live)
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_ENTERPRISE_PRICE_ID`
- `RESEND_API_KEY`
- `FROM_EMAIL`

### Option 2: Railway

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Option 3: Render

**1. Créer un Blueprint:**
- Connecter GitHub
- Utiliser `render.yaml`

**2. Ajouter PostgreSQL:**
- Create Database
- Copy connection string

**3. Ajouter Redis:**
- Create Redis
- Copy connection URL

### Option 4: VPS (DigitalOcean, AWS, etc.)

**Docker Compose en production:**

```bash
# Sur le serveur
git clone https://github.com/Aguertil/screenapi.git
cd screenapi

# Créer .env.local avec les bonnes valeurs

# Lancer
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🧪 Tests

### Test 1: Inscription Email/Password

```bash
curl -X POST http://localhost:43210/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

✅ **Attendu:**
- Compte créé
- Subscription FREE active
- API key générée
- Email de bienvenue envoyé

### Test 2: Login Google/GitHub

1. Aller sur `/auth/signin`
2. Cliquer "Continue with Google/GitHub"
3. Autoriser
4. Redirection vers `/dashboard`

✅ **Attendu:**
- Connecté
- Dashboard accessible
- Stats visibles

### Test 3: Créer une API Key

1. Dashboard → "Create New Key"
2. Entrer un nom
3. Copier la clé

✅ **Attendu:**
- Clé créée
- Visible dans la liste
- Copiable au clipboard

### Test 4: Capture Screenshot

```bash
curl -X POST http://localhost:43210/api/v1/screenshot \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","devicePreset":"iphone-15-pro"}' \
  --output screenshot.png
```

✅ **Attendu:**
- Image PNG créée
- Dimensions iPhone 15 Pro (393×852)
- Crédits décomptés

### Test 5: Web Scraping

```bash
curl -X POST http://localhost:43210/api/v1/scrape \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://example.com",
    "extractMetadata":true,
    "extractText":true
  }'
```

✅ **Attendu:**
- JSON avec title, metadata, text
- 200 status

### Test 6: Upgrade Pro avec Code Promo

1. Aller sur `/pricing`
2. Cliquer "Have a promo code?"
3. Entrer `LAUNCH20`
4. Cliquer "Upgrade to Pro"
5. Carte test: `4242 4242 4242 4242`
6. Compléter

✅ **Attendu:**
- Paiement réussi avec -20%
- Plan upgraded to PRO
- Email de confirmation
- Crédits à 10,000
- Rate limit à 100/min

---

## 🔒 Sécurité

### Checklist Production

- [ ] `NEXTAUTH_SECRET` sécurisé (32+ chars)
- [ ] Stripe en mode LIVE
- [ ] OAuth redirect URIs mis à jour
- [ ] HTTPS activé
- [ ] Rate limiting activé (Redis)
- [ ] Variables d'env sécurisées (Vercel/Railway secrets)
- [ ] Logs d'erreur configurés (Sentry)
- [ ] Backup database automatique
- [ ] Monitoring (Uptime Robot, Checkly)

### Variables à NE JAMAIS Committer

```
NEXTAUTH_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_SECRET
DATABASE_URL (avec password)
```

---

## 📈 Monitoring & Analytics

### Stripe Dashboard

- Paiements en temps réel
- Abonnements actifs
- Revenue charts
- Failed payments alerts

### Resend Dashboard

- Emails envoyés
- Taux d'ouverture
- Bounces / Spam
- Logs détaillés

### Prisma Studio

```bash
pnpm --filter @repo/database studio
```

Accédez à: http://localhost:5555

### Logs Docker

```bash
docker-compose logs -f app
```

---

## 🆘 Troubleshooting

### "Prisma Client did not initialize yet"

```bash
pnpm --filter @repo/database db:generate
pnpm --filter @repo/database db:push
```

### "Invalid API key"

- Vérifiez que la clé est active
- Vérifiez qu'elle n'est pas expirée
- Vérifiez le header `x-api-key`

### "Rate limit exceeded"

- FREE: 10/min
- PRO: 100/min
- Attendez 1 minute et réessayez

### Stripe webhook ne fonctionne pas

```bash
# Local testing
stripe listen --forward-to http://localhost:43210/api/webhooks/stripe

# Copier le webhook secret
stripe listen --print-secret

# Ajouter dans .env.local
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Emails non reçus

1. Vérifiez spam
2. Vérifiez RESEND_API_KEY
3. Vérifiez logs Resend Dashboard
4. Testez avec `onboarding@resend.dev`

---

## 📚 Documentation

- **`README.md`** - Vue d'ensemble
- **`SETUP_AUTHENTICATION.md`** - OAuth & Stripe détaillé
- **`SETUP_EMAILS.md`** - Resend configuration
- **`DEVELOPER_GUIDE.md`** - Guide pour développeurs (device presets, cas d'usage)
- **`EXAMPLES.md`** - Code examples (7 langages)
- **`DEPLOYMENT.md`** - Options de déploiement

---

## 🎯 Prochaines Étapes Recommandées

### Court Terme
1. ✅ Configurer Google/GitHub OAuth
2. ✅ Configurer Stripe (test mode)
3. ✅ Configurer Resend (emails)
4. ✅ Tester tout en local
5. ✅ Créer des codes promo

### Moyen Terme
1. 🔜 Déployer sur Vercel/Railway
2. 🔜 Configurer domaine custom
3. 🔜 Stripe en mode LIVE
4. 🔜 Analytics (Plausible, PostHog)
5. 🔜 Monitoring (Sentry, Uptime Robot)

### Long Terme
1. 🔮 Support client (Intercom, Crisp)
2. 🔮 Webhooks pour utilisateurs
3. 🔮 API v2 avec plus de features
4. 🔮 Admin dashboard
5. 🔮 Referral program

---

## ✅ Checklist Finale

### Installation
- [ ] Code téléchargé
- [ ] Docker installé
- [ ] `.env.local` créé
- [ ] App lance sans erreurs
- [ ] Accessible sur http://localhost:43210

### Authentification
- [ ] Inscription email/password fonctionne
- [ ] Google OAuth configuré
- [ ] GitHub OAuth configuré
- [ ] Session persiste après refresh

### Paiements
- [ ] Stripe test mode configuré
- [ ] Produits Pro/Enterprise créés
- [ ] Webhook configuré
- [ ] Test checkout réussi
- [ ] Plan upgraded après paiement

### Emails
- [ ] Resend configuré
- [ ] Email bienvenue reçu
- [ ] Email paiement réussi reçu
- [ ] Emails visibles dans Resend Dashboard

### Features
- [ ] API keys créées
- [ ] Screenshot API fonctionne
- [ ] Scraping API fonctionne
- [ ] Device presets testés
- [ ] Playground fonctionne
- [ ] Dashboard affiche les stats
- [ ] Account settings fonctionne

### Production (optionnel)
- [ ] Déployé sur Vercel/Railway
- [ ] Domaine custom configuré
- [ ] HTTPS actif
- [ ] Stripe en mode LIVE
- [ ] Monitoring actif

---

**🎉 Félicitations! Votre SaaS ScreenAPI est maintenant complet et prêt pour la production!**

Pour toute question, consultez la documentation ou créez une issue sur GitHub.
