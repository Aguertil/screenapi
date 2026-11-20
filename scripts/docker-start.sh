#!/bin/sh
# Démarrage du conteneur (Render) : crée/met à jour le schéma puis lance Next.js
set -e

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
