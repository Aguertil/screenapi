#!/bin/sh
# Démarrage du conteneur (Render) : crée/met à jour le schéma puis lance Next.js
set -e

# Nettoie DATABASE_URL si elle a été collée avec des guillemets, des espaces,
# la commande « psql » ou le nom de la variable devant (copie depuis Neon).
if [ -n "$DATABASE_URL" ]; then
  DATABASE_URL=$(printf '%s' "$DATABASE_URL" \
    | tr -d '\r\n' \
    | sed -E "s/^[[:space:]]*(export[[:space:]]+)?(DATABASE_URL=)?[[:space:]]*(psql[[:space:]]+)?//; s/^[\"']+//; s/[\"'[:space:]]+$//")
  export DATABASE_URL
  case "$DATABASE_URL" in
    postgres://*|postgresql://*) echo "🗄️  DATABASE_URL lue (postgresql://…)" ;;
    *) echo "❌ DATABASE_URL ne commence pas par postgresql:// (vérifiez la valeur dans Render)" ;;
  esac
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL n'est pas défini : comptes, clés API et captures ne fonctionneront pas."
  echo "   Render → service screenapi → Environment → ajouter DATABASE_URL (Internal Database URL de screenapi-db)."
else
  echo "🗄️  Synchronisation du schéma Prisma..."
  # Pas de dossier migrations dans le dépôt : db push crée les tables manquantes.
  # Sans --accept-data-loss, il refuse toute modification destructive.
  (cd /app/packages/database && pnpm exec prisma db push --skip-generate) \
    || echo "⚠️  prisma db push a échoué : vérifiez DATABASE_URL et l'état de la base"
fi

cd /app/apps/screenapi
exec pnpm start
