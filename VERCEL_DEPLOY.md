# 🚀 Déploiement Vercel - Guide Ultra-Rapide

## ✅ Configuration Automatique Prête!

J'ai pushé tous les fichiers de configuration sur GitHub. Vercel va maintenant **détecter automatiquement** les bons paramètres!

---

## 📋 Ce que Vous Devez Faire (3 étapes)

### Étape 1: Importer le Projet (2 min)

**Dans Vercel Dashboard:**

1. Allez sur https://vercel.com/dashboard
2. Cliquez **"Add New..."** → **"Project"**
3. Trouvez votre repo **`screenapi`**
4. Cliquez **"Import"**

**Vercel va automatiquement détecter:**
- ✅ Framework: Next.js
- ✅ Root Directory: `apps/screenapi`
- ✅ Build Command: Configuré dans `vercel.json`
- ✅ Install Command: Configuré dans `vercel.json`

### Étape 2: Ajouter SEULEMENT 2 Variables (1 min)

**Avant de cliquer "Deploy", ajoutez juste ces 2 variables:**

Dans **"Environment Variables"**:

```
NODE_ENV = production
```
```
NEXTAUTH_SECRET = [allez sur https://generate-secret.vercel.app/32 et copiez]
```

**Environment:** Sélectionnez "Production, Preview, and Development"

**C'est tout pour maintenant!** Les autres variables (DATABASE_URL, REDIS_URL) seront ajoutées automatiquement par les intégrations.

### Étape 3: Ajouter les Intégrations (2 min)

**Si vous voyez "Optional Integrations":**

1. Cliquez **"Add"** sur **"Vercel Postgres"** (ou "Prisma Postgres")
2. Cliquez **"Add"** sur **"Vercel Redis"** (ou juste "Redis")

**Si vous ne les voyez pas:**
- Pas grave, cliquez juste "Deploy"
- On les ajoutera après (encore plus simple)

### Étape 4: DEPLOY! 🚀

Cliquez sur le gros bouton **"Deploy"**

---

## ⏱️ Pendant le Build (3-5 minutes)

Vercel va:
1. ✅ Installer pnpm 9
2. ✅ Installer les dépendances
3. ✅ Builder l'application Next.js
4. ✅ Déployer sur le CDN global

**Vous verrez les logs en temps réel.**

Si ça échoue, copiez l'erreur et envoyez-la moi!

---

## 🎉 Après le Deploy

**Une fois le build réussi:**

1. **Copiez votre URL** (ex: `https://screenapi-abc123.vercel.app`)

2. **Si vous n'avez pas ajouté les intégrations avant:**
   - Allez dans **Settings** → **Integrations**
   - Ajoutez **Vercel Postgres** 
   - Ajoutez **Vercel Redis**
   - Ça va automatiquement ajouter `DATABASE_URL` et `REDIS_URL`

3. **Ajoutez les URLs finales:**
   - **Settings** → **Environment Variables**
   - Ajoutez:
     ```
     NEXTAUTH_URL = https://votre-url.vercel.app
     NEXT_PUBLIC_API_URL = https://votre-url.vercel.app
     ```

4. **Redéployez:**
   - **Deployments** → 3 points → **"Redeploy"**

---

## 🧪 Tester Votre App

Allez sur: **https://votre-url.vercel.app**

**Test rapide:**
1. ✅ Homepage s'affiche
2. ✅ Cliquez "Sign Up"
3. ✅ Créez un compte email/password
4. ✅ Vous êtes redirigé vers `/dashboard`
5. ✅ Une API key est visible
6. ✅ Allez sur `/playground` et testez un screenshot

---

## 🆘 Si Erreur

**"pnpm version error"**
→ Le `vercel.json` devrait régler ça automatiquement
→ Si ça persiste, dites-moi!

**"Prisma Client not initialized"**
→ Normal au premier deploy
→ Ajoutez les intégrations Database/Redis et redéployez

**"NEXTAUTH_URL not set"**
→ Ajoutez `NEXTAUTH_URL` avec votre vraie URL Vercel
→ Redéployez

---

## 📝 Checklist Complète

**Avant Deploy:**
- [ ] Repo importé dans Vercel
- [ ] `NODE_ENV` ajouté
- [ ] `NEXTAUTH_SECRET` ajouté (généré)

**Pendant Deploy:**
- [ ] Build réussit (pas d'erreur)
- [ ] URL Vercel obtenue

**Après Deploy:**
- [ ] Vercel Postgres ajouté (integration)
- [ ] Vercel Redis ajouté (integration)
- [ ] `NEXTAUTH_URL` ajouté avec URL réelle
- [ ] `NEXT_PUBLIC_API_URL` ajouté avec URL réelle
- [ ] Redéployé

**Test:**
- [ ] Homepage accessible
- [ ] Signup fonctionne
- [ ] Dashboard accessible
- [ ] API key visible
- [ ] Playground fonctionne

---

## 🎯 Résumé Ultra-Court

1. **Import projet** depuis GitHub dans Vercel
2. **Ajoutez** `NODE_ENV` et `NEXTAUTH_SECRET`
3. **Deploy**
4. **Ajoutez** intégrations Postgres + Redis
5. **Ajoutez** `NEXTAUTH_URL` et `NEXT_PUBLIC_API_URL`
6. **Redeploy**
7. **Testez!** 🎉

---

**C'est tout! Dites-moi quand c'est déployé!** 😊
