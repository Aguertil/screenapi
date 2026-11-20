#!/usr/bin/env bash
# Mise à jour : récupère le dernier code et redémarre (environ 1 minute de coupure).
set -euo pipefail
cd "$(dirname "$0")"
git -C .. pull -q
docker compose up -d --build
docker image prune -f >/dev/null
echo "À jour."
