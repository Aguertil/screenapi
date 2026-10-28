# 🔐 Guide de Configuration - Authentification & Paiements

Ce guide vous explique comment configurer l'authentification (Google, GitHub) et les paiements Stripe.

## 📋 Prérequis

- Compte Google Cloud Platform (pour OAuth Google)
- Compte GitHub (pour OAuth GitHub)  
- Compte Stripe (pour les paiements)

---

## 1️⃣ Mettre à Jour la Base de Données

Les nouveaux modèles (Account, Session, PromoCode, Payment) ont été ajoutés au schéma Prisma.

```bash
# Générer les types Prisma
pnpm --filter @repo/database db:generate

# Créer les tables en base
pnpm --filter @repo/database db:push
```

---

## 2️⃣ Installer les Dépendances

```bash
cd apps/screenapi
pnpm install next-auth stripe
pnpm install --save-dev @next-auth/prisma-adapter
```

---

## 3️⃣ Configurer Google OAuth

### A. Créer un Projet Google Cloud

1. Allez sur https://console.cloud.google.com
2. Créez un nouveau projet ou sélectionnez-en un
3. Activez l'API "Google+ API"

### B. Créer des Credentials OAuth

1. Menu **APIs & Services** → **Credentials**
2. Cliquez **Create Credentials** → **OAuth client ID**
3. Type d'application: **Web application**
4. Nom: `ScreenAPI`
5. **Authorized JavaScript origins:**
   ```
   http://localhost:43210
   https://votredomaine.com
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:43210/api/auth/callback/google
   https://votredomaine.com/api/auth/callback/google
   ```
7. Cliquez **Create**
8. Copiez le **Client ID** et **Client Secret**

### C. Ajouter à `.env.local`

```env
GOOGLE_CLIENT_ID="123456789-abc...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

---

## 4️⃣ Configurer GitHub OAuth

### A. Créer une GitHub OAuth App

1. Allez sur https://github.com/settings/developers
2. Cliquez **New OAuth App**
3. Remplissez:
   - **Application name:** ScreenAPI
   - **Homepage URL:** `http://localhost:43210`
   - **Authorization callback URL:** `http://localhost:43210/api/auth/callback/github`
4. Cliquez **Register application**
5. Générez un **Client Secret**
6. Copiez le **Client ID** et **Client Secret**

### B. Ajouter à `.env.local`

```env
GITHUB_CLIENT_ID="Iv1.abc123..."
GITHUB_CLIENT_SECRET="abc123def456..."
```

---

## 5️⃣ Configurer NextAuth Secret

Générez une clé secrète sécurisée:

```bash
openssl rand -base64 32
```

Ajoutez à `.env.local`:

```env
NEXTAUTH_URL="http://localhost:43210"
NEXTAUTH_SECRET="votre-secret-genere"
```

---

## 6️⃣ Configurer Stripe

### A. Créer un Compte Stripe

1. Allez sur https://dashboard.stripe.com/register
2. Créez un compte (utilisez le mode Test pour commencer)

### B. Obtenir les Clés API

1. Menu **Developers** → **API keys**
2. Copiez:
   - **Publishable key** (commence par `pk_test_`)
   - **Secret key** (commence par `sk_test_`)

### C. Créer les Produits et Prix

1. Menu **Products** → **Add product**

**Produit 1: Pro**
- Name: `Pro Plan`
- Price: `$49.00 USD`
- Billing period: `Monthly`
- Copiez le **Price ID** (commence par `price_`)

**Produit 2: Enterprise**
- Name: `Enterprise Plan`
- Price: `$299.00 USD`
- Billing period: `Monthly`
- Copiez le **Price ID**

### D. Configurer le Webhook

1. Menu **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `http://localhost:43210/api/webhooks/stripe` (pour test local, utilisez Stripe CLI)
3. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copiez le **Signing secret** (commence par `whsec_`)

### E. Ajouter à `.env.local`

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

---

## 7️⃣ Tester les Webhooks Stripe en Local

Pour tester les webhooks Stripe en développement local:

### A. Installer Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (avec Scoop)
scoop install stripe

# Ou téléchargez: https://github.com/stripe/stripe-cli/releases
```

### B. Login Stripe CLI

```bash
stripe login
```

### C. Forward les Webhooks

```bash
stripe listen --forward-to http://localhost:43210/api/webhooks/stripe
```

Le CLI va afficher un webhook secret (commence par `whsec_`). Copiez-le dans `.env.local`.

### D. Tester un Paiement

Utilisez les cartes de test Stripe:
- **Succès:** `4242 4242 4242 4242`
- **Échec:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`
- Date: n'importe quelle date future
- CVC: n'importe quels 3 chiffres

---

## 8️⃣ Créer des Codes Promo

### Via Prisma Studio

```bash
pnpm --filter @repo/database studio
```

Ouvrez le modèle `PromoCode` et créez:

**Exemple 1: Réduction de 20%**
```json
{
  "code": "LAUNCH20",
  "type": "PERCENTAGE",
  "value": 20,
  "maxUses": 100,
  "isActive": true,
  "description": "20% off launch discount"
}
```

**Exemple 2: $10 de réduction**
```json
{
  "code": "SAVE10",
  "type": "FIXED_AMOUNT",
  "value": 1000,
  "maxUses": 50,
  "isActive": true,
  "description": "$10 off"
}
```

**Exemple 3: Crédits gratuits**
```json
{
  "code": "FREE1000",
  "type": "FREE_CREDITS",
  "value": 1000,
  "maxUses": 20,
  "isActive": true,
  "description": "1000 free credits"
}
```

---

## 9️⃣ Lancer l'Application

```bash
# Avec Docker
docker-compose up --build

# Sans Docker
pnpm --filter screenapi dev
```

---

## 🧪 Tester les Fonctionnalités

### Test 1: Inscription avec Email

1. Allez sur http://localhost:43210/auth/signup
2. Créez un compte avec email/mot de passe
3. Vous devriez être redirigé vers `/dashboard`
4. Une subscription FREE et une API key sont créées automatiquement

### Test 2: Login avec Google

1. Allez sur http://localhost:43210/auth/signin
2. Cliquez sur "Continue with Google"
3. Autorisez l'application
4. Vous êtes connecté et redirigé vers `/dashboard`

### Test 3: Login avec GitHub

1. Allez sur http://localhost:43210/auth/signin
2. Cliquez sur "Continue with GitHub"
3. Autorisez l'application
4. Vous êtes connecté et redirigé vers `/dashboard`

### Test 4: Upgrade vers Pro avec Code Promo

1. Connectez-vous
2. Allez sur http://localhost:43210/pricing
3. Cliquez sur "Have a promo code?"
4. Entrez `LAUNCH20` (si vous l'avez créé)
5. Cliquez sur "Upgrade to Pro"
6. Entrez la carte de test: `4242 4242 4242 4242`
7. Complétez le paiement
8. Vous êtes redirigé vers `/dashboard` avec le plan Pro actif

### Test 5: Vérifier le Webhook

Si vous avez `stripe listen` qui tourne:

1. Complétez un paiement
2. Dans le terminal Stripe CLI, vous verrez les événements
3. Dans votre base de données, vérifiez:
   - `subscriptions`: status = ACTIVE, plan = PRO
   - `payments`: un nouvel enregistrement avec status = succeeded
   - `promo_code_usages`: si vous avez utilisé un code promo

---

## 🔒 Sécurité en Production

### Variables d'Environnement

En production, utilisez:
- `NEXTAUTH_URL`: votre domaine HTTPS (`https://votredomaine.com`)
- `STRIPE_SECRET_KEY`: clé live (commence par `sk_live_`)
- `STRIPE_WEBHOOK_SECRET`: secret du webhook en prod
- Nouveaux OAuth URLs avec votre domaine

### Protection CSRF

NextAuth gère automatiquement la protection CSRF.

### Rate Limiting

Le rate limiting est déjà implémenté via Redis dans l'API.

---

## 🎯 Prochaines Étapes

1. ✅ Créer une page `/dashboard` complète (gestion des API keys, usage, paiements)
2. ✅ Ajouter un portail client Stripe (gérer abonnement, paiements, factures)
3. ✅ Ajouter des emails de confirmation (avec Resend ou SendGrid)
4. ✅ Implémenter une page "Account Settings"
5. ✅ Ajouter des analytics (Plausible, PostHog)

---

## 🆘 Troubleshooting

### "Invalid credentials" lors du login Google/GitHub

- Vérifiez que les redirect URIs dans Google/GitHub correspondent exactement
- Vérifiez que `NEXTAUTH_URL` est correct dans `.env.local`

### Webhook Stripe ne se déclenche pas

- Assurez-vous que `stripe listen` est actif
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est le bon
- Vérifiez les logs dans le terminal Stripe CLI

### "User not found" après OAuth

- Vérifiez que la base de données a les nouvelles tables (Account, Session)
- Relancez `pnpm --filter @repo/database db:push`

### Code promo non reconnu

- Vérifiez que le code existe dans la table `promo_codes`
- Vérifiez que `isActive = true`
- Vérifiez que `expiresAt` est null ou dans le futur

---

**C'est tout! Vous avez maintenant une authentification complète avec OAuth et paiements Stripe** 🎉
