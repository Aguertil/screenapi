#!/usr/bin/env bash
# Installation de ScreenAPI sur un serveur Ubuntu 24.04 neuf (à lancer en root).
#   curl -fsSL https://raw.githubusercontent.com/Aguertil/screenapi/main/deploy/install.sh | bash -s -- mon-domaine.com contact@mon-domaine.com
set -euo pipefail

DOMAIN="${1:?Usage: install.sh DOMAINE EMAIL_CONTACT}"
CONTACT="${2:?Usage: install.sh DOMAINE EMAIL_CONTACT}"
DIR=/opt/screenapi

echo "==> Mises à jour de sécurité automatiques et pare-feu"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git ufw unattended-upgrades ca-certificates curl >/dev/null
ufw allow OpenSSH >/dev/null && ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null && ufw --force enable >/dev/null

echo "==> Docker"
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh >/dev/null

echo "==> Mémoire d'appoint (2 Go de swap)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Code"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull -q; else git clone -q https://github.com/Aguertil/screenapi.git "$DIR"; fi
cd "$DIR/deploy"

if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s|^DOMAIN=.*|DOMAIN=$DOMAIN|; s|^CONTACT_EMAIL=.*|CONTACT_EMAIL=$CONTACT|" .env
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" .env
  sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$(openssl rand -base64 32)|" .env
  chmod 600 .env
fi

echo "==> Sauvegarde quotidienne de la base (7 jours gardés)"
mkdir -p backups
cat > /etc/cron.daily/screenapi-backup <<CRON
#!/bin/sh
cd $DIR/deploy && docker compose exec -T postgres pg_dump -U screenapi screenapi | gzip > backups/screenapi-\$(date +%F).sql.gz
find $DIR/deploy/backups -name '*.sql.gz' -mtime +7 -delete
CRON
chmod +x /etc/cron.daily/screenapi-backup

echo "==> Construction et démarrage (5 à 10 minutes la première fois)"
docker compose up -d --build

echo
echo "Terminé. Pointez le DNS de $DOMAIN (enregistrement A) vers l'IP de ce serveur :"
curl -s -4 ifconfig.me || true
echo
echo "Puis ouvrez https://$DOMAIN. Paiements : remplir les lignes STRIPE_ dans $DIR/deploy/.env, puis"
echo "  cd $DIR/deploy && docker compose up -d"
