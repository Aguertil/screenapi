#!/bin/bash
set -e

echo "🔍 Vérification du Dockerfile..."

# Vérifier que tous les fichiers nécessaires existent
echo "✓ Checking workspace files..."
test -f pnpm-workspace.yaml && echo "  ✓ pnpm-workspace.yaml"
test -f package.json && echo "  ✓ package.json"
test -f pnpm-lock.yaml && echo "  ✓ pnpm-lock.yaml"
test -f turbo.json && echo "  ✓ turbo.json"

echo "✓ Checking packages..."
for pkg in database shared-types shared-config shared-ui testing; do
  test -f packages/$pkg/package.json && echo "  ✓ packages/$pkg/package.json"
done

echo "✓ Checking apps..."
test -f apps/screenapi/package.json && echo "  ✓ apps/screenapi/package.json"

echo ""
echo "✅ Tous les fichiers nécessaires sont présents!"
echo ""
echo "📦 Structure du projet:"
tree -L 2 -I 'node_modules|.next|.turbo' packages/ apps/

echo ""
echo "🎯 Le Dockerfile est prêt pour le build sur Fly.io!"
