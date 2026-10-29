# 🚀 Déploiement Fly.io - Étapes Exactes

## 1️⃣ Installation (si pas déjà fait)

```bash
# Windows PowerShell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

## 2️⃣ Se connecter à Fly.io

```bash
fly auth login
```
Cela ouvrira ton navigateur pour te connecter.

## 3️⃣ Créer l'application (une seule fois)

```bash
cd C:\Users\h\screenapi-main
fly launch --no-deploy
```

**Réponds aux questions:**
- App Name: `screenapi` (ou choisis un autre nom)
- Region: `cdg` (Paris) ✅
- PostgreSQL: `y` (OUI) ✅
- Redis: `y` (OUI) ✅

## 4️⃣ Configurer les secrets

```bash
# NextAuth (OBLIGATOIRE)
fly secrets set NEXTAUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set NEXTAUTH_URL="https://ton-app.fly.dev"

# OAuth Google (si tu veux Google login)
fly secrets set GOOGLE_CLIENT_ID="ton-client-id"
fly secrets set GOOGLE_CLIENT_SECRET="ton-client-secret"

# OAuth GitHub (si tu veux GitHub login)
fly secrets set GITHUB_CLIENT_ID="ton-client-id"
fly secrets set GITHUB_CLIENT_SECRET="ton-client-secret"

# Stripe (pour les paiements)
fly secrets set STRIPE_SECRET_KEY="sk_test_..."
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend (pour les emails)
fly secrets set RESEND_API_KEY="re_..."
fly secrets set RESEND_FROM_EMAIL="noreply@ton-domaine.com"
```

## 5️⃣ Déployer

```bash
fly deploy
```

Cela va:
1. ✅ Builder l'image Docker (5-10 minutes)
2. ✅ Déployer sur Fly.io
3. ✅ Lancer l'application

## 6️⃣ Migrations de base de données

```bash
fly ssh console
cd packages/database
pnpm exec prisma migrate deploy
exit
```

## 7️⃣ Ouvrir l'app

```bash
fly open
```

---

## 📋 Commandes utiles

```bash
# Voir les logs
fly logs

# Voir le statut
fly status

# Redéployer après un changement
fly deploy

# SSH dans l'app
fly ssh console

# Gérer les secrets
fly secrets list
fly secrets set KEY=value
fly secrets unset KEY
```

## 🐛 Troubleshooting

### Build échoue
```bash
fly logs
```

### App crash au démarrage
```bash
fly logs -a screenapi
fly ssh console
```

### Base de données non accessible
```bash
fly postgres connect -a screenapi-db
```

---

**C'est tout!** Une fois `fly launch` terminé, ton app sera en ligne! 🎉
