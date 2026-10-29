# Déploiement sur Fly.io

## Prérequis

1. **Installer Fly CLI:**
   ```bash
   # macOS / Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Se connecter à Fly.io:**
   ```bash
   fly auth login
   ```

## Configuration

1. **Créer l'application:**
   ```bash
   fly launch --no-deploy
   ```
   - Nom: `screenapi` (ou personnalisé)
   - Région: `cdg` (Paris) recommandé
   - Base de données PostgreSQL: **OUI**
   - Redis: **OUI** (pour le rate limiting)

2. **Configurer les secrets:**
   ```bash
   # Base de données (déjà configuré automatiquement)
   fly secrets set DATABASE_URL="postgres://..."
   
   # NextAuth
   fly secrets set NEXTAUTH_SECRET="$(openssl rand -base64 32)"
   fly secrets set NEXTAUTH_URL="https://screenapi.fly.dev"
   
   # OAuth Google
   fly secrets set GOOGLE_CLIENT_ID="votre-client-id"
   fly secrets set GOOGLE_CLIENT_SECRET="votre-client-secret"
   
   # OAuth GitHub
   fly secrets set GITHUB_CLIENT_ID="votre-client-id"
   fly secrets set GITHUB_CLIENT_SECRET="votre-client-secret"
   
   # Stripe
   fly secrets set STRIPE_SECRET_KEY="sk_..."
   fly secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
   fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
   
   # Resend (emails)
   fly secrets set RESEND_API_KEY="re_..."
   fly secrets set RESEND_FROM_EMAIL="noreply@screenapi.com"
   
   # Redis
   fly secrets set REDIS_URL="redis://..."
   ```

3. **Vérifier les secrets:**
   ```bash
   fly secrets list
   ```

## Déploiement

1. **Premier déploiement:**
   ```bash
   fly deploy
   ```

2. **Migrations de base de données:**
   ```bash
   fly ssh console
   cd /app/packages/database
   pnpm exec prisma migrate deploy
   exit
   ```

3. **Vérifier les logs:**
   ```bash
   fly logs
   ```

4. **Ouvrir l'application:**
   ```bash
   fly open
   ```

## Gestion

### Voir le statut
```bash
fly status
```

### Scaler l'application
```bash
# Augmenter la mémoire
fly scale memory 2048

# Augmenter les CPUs
fly scale vm shared-cpu-2x

# Ajouter des instances
fly scale count 2
```

### Mettre à jour
```bash
git push github main
fly deploy
```

### Base de données

**Se connecter à PostgreSQL:**
```bash
fly postgres connect -a screenapi-db
```

**Backup:**
```bash
fly postgres backup create -a screenapi-db
```

### Redis

**Se connecter à Redis:**
```bash
fly redis connect
```

### Monitoring

**Dashboard Fly.io:**
```bash
fly dashboard
```

**Métriques:**
```bash
fly metrics
```

**Logs en temps réel:**
```bash
fly logs -f
```

## Environnements multiples

### Staging
```bash
fly launch --name screenapi-staging
fly deploy --config fly.staging.toml
```

### Production
```bash
fly deploy --config fly.toml
```

## Rollback

```bash
fly releases
fly rollback <version>
```

## Troubleshooting

### Build échoue
```bash
fly logs --app screenapi
fly status
```

### Base de données non accessible
```bash
fly postgres db list -a screenapi-db
fly secrets list
```

### Problèmes de mémoire
```bash
fly scale memory 2048
```

## URLs utiles

- Dashboard: https://fly.io/dashboard
- Docs: https://fly.io/docs
- Status: https://status.fly.io
