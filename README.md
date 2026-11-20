# ScreenAPI

API de captures d'écran de pages web : une URL en entrée, une image (PNG, JPEG, WebP) ou un PDF en sortie.
Pleine page, 20 appareils, mode sombre, Retina, capture d'un élément, bannières cookies masquées, cache gratuit.

Offre : gratuit (100 captures/mois), Starter 9 €, Growth 29 €, Scale 79 € par mois (`apps/screenapi/src/lib/plans.ts`).
Exploité par MB Auto SASU.

## Structure
- `apps/screenapi` : site + API (Next.js 15, Playwright/Chrome, Prisma)
- `packages/database` : schéma PostgreSQL (Prisma)
- `deploy/` : mise en production sur un serveur dédié (Docker, HTTPS, sauvegardes) — **voir [deploy/README.md](deploy/README.md)**
- `docs/archive/` : anciens documents de travail

## API en bref
```bash
curl "https://VOTRE-DOMAINE/api/v1/screenshot?url=https://example.com&full_page=true" \
  -H "x-api-key: VOTRE_CLE" -o capture.png
```
Documentation complète sur `/docs` du site.

## Développement
```bash
pnpm install
cp .env.example apps/screenapi/.env.local   # DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, CHROME_PATH
cd packages/database && pnpm exec prisma db push
cd ../../apps/screenapi && pnpm dev          # http://localhost:43210
pnpm test                                    # tests unitaires
```

## Sécurité
- Clés API stockées sous forme d'empreinte SHA-256
- Réseaux privés et métadonnées cloud bloqués (anti-SSRF), y compris pendant le chargement de la page
- Captures jamais conservées ; journaux d'usage effacés après 90 jours
