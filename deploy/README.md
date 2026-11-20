# Mettre ScreenAPI en ligne (serveur dédié, ~7 €/mois)

Tout tourne sur un seul serveur : le site, l'API, Chrome, la base PostgreSQL, Redis et le HTTPS (Caddy).
Sauvegarde de la base chaque nuit, 7 jours gardés.

## 1. Le domaine
Achetez un nom de domaine (par ex. chez OVH ou LWS, ~10 €/an). Vous en aurez besoin à l'étape 3.

## 2. Le serveur (Hetzner)
1. Créez un compte sur https://www.hetzner.com/cloud (au nom de MB Auto SASU, avec le n° de TVA : pas de TVA facturée).
2. Nouveau serveur : **Ubuntu 24.04**, emplacement **Allemagne** (Falkenstein ou Nuremberg),
   type **CX23** (2 vCPU, 4 Go) ou, s'il n'est pas disponible, **CAX11** (Arm, 4 Go). Ajoutez votre clé SSH.
3. Notez l'adresse IP du serveur.

## 3. Le DNS
Chez votre registraire, créez deux enregistrements **A** vers l'IP du serveur : `mondomaine.com` et `www.mondomaine.com`.

## 4. L'installation (une commande)
Connectez-vous au serveur (`ssh root@IP`) puis :

```bash
curl -fsSL https://raw.githubusercontent.com/Aguertil/screenapi/main/deploy/install.sh | bash -s -- mondomaine.com contact@mondomaine.com
```

Le script installe Docker, le pare-feu, 2 Go de swap, les mises à jour de sécurité automatiques,
génère les mots de passe, lance tout et prépare la sauvegarde quotidienne. Comptez 10 minutes.
Le site est ensuite sur `https://mondomaine.com` (certificat HTTPS automatique).

## 5. Les paiements (Stripe)
1. Créez le compte Stripe de **MB Auto SASU** (https://dashboard.stripe.com) : informations de la société,
   IBAN, et dans *Paramètres → Factures* les mentions légales (SIREN, TVA, adresse).
2. TVA : en vendant à des professionnels de l'UE avec leur n° de TVA, Stripe applique l'autoliquidation si
   **Stripe Tax** est activé (0,5 % par transaction). Sinon laissez `STRIPE_AUTOMATIC_TAX=false` et voyez avec
   votre comptable.
3. Copiez la **clé secrète de test** (`sk_test_…`) dans `/opt/screenapi/deploy/.env` (`STRIPE_SECRET_KEY=`), puis :
   ```bash
   cd /opt/screenapi/deploy
   docker compose up -d
   docker compose exec app node scripts/stripe-setup.mjs
   ```
   Le script crée les 3 prix en euros, le webhook et le portail client, et affiche les lignes à coller dans `.env`.
   Relancez `docker compose up -d`.
4. Testez un abonnement avec la carte `4242 4242 4242 4242`.
5. Quand tout va bien : refaites l'étape 3 avec la **clé de production** (`sk_live_…`).

## 6. E-mails (facultatif)
Pour les e-mails de bienvenue et de paiement : compte Resend, domaine vérifié, puis `RESEND_API_KEY` et
`FROM_EMAIL` dans `.env`.

## Au quotidien
- Mettre à jour : `/opt/screenapi/deploy/update.sh`
- Voir les journaux : `cd /opt/screenapi/deploy && docker compose logs -f app`
- Sauvegardes : `/opt/screenapi/deploy/backups/`
- Plus de trafic : passer à un serveur de 8 Go et mettre `MAX_CONCURRENCY=6` dans `.env`.
