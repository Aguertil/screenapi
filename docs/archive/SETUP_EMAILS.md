# 📧 Configuration des Emails avec Resend

Ce guide explique comment configurer l'envoi d'emails transactionnels avec Resend.

## 🎯 Emails Automatiques

L'application envoie automatiquement 4 types d'emails:

1. **Email de Bienvenue** - À l'inscription (email/password ou OAuth)
2. **Email de Paiement Réussi** - Après un paiement Stripe réussi
3. **Email de Paiement Échoué** - Si un paiement Stripe échoue
4. **Email d'Annulation** - Quand un abonnement est annulé

---

## 📋 Pourquoi Resend?

- ✅ **Free tier généreux**: 100 emails/jour gratuits (3000/mois)
- ✅ **Très simple**: Une API key et c'est tout
- ✅ **Pas de domaine requis**: Fonctionne avec `onboarding@resend.dev` en test
- ✅ **Templates HTML**: Emails stylés et responsive
- ✅ **Analytics**: Suivi des emails envoyés

---

## 🚀 Configuration

### 1. Créer un Compte Resend

1. Allez sur https://resend.com
2. Créez un compte (gratuit)
3. Confirmez votre email

### 2. Obtenir votre API Key

1. Allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Nom: `ScreenAPI Development`
4. Permission: **Full access** (ou **Sending access** uniquement)
5. Copiez la clé (elle commence par `re_`)

### 3. Ajouter dans `.env.local`

```env
RESEND_API_KEY="re_abc123..."
FROM_EMAIL="onboarding@resend.dev"
```

**Note:** En développement, vous pouvez utiliser `onboarding@resend.dev` qui fonctionne sans configuration de domaine.

---

## 🌐 Configuration du Domaine (Production)

Pour la production, configurez votre propre domaine:

### 1. Ajouter un Domaine dans Resend

1. Allez dans **Domains** → **Add Domain**
2. Entrez votre domaine (ex: `screenapi.com`)
3. Resend vous donnera des enregistrements DNS à ajouter

### 2. Configurer les DNS

Ajoutez ces enregistrements DNS chez votre registrar:

```
Type: TXT
Name: @
Value: resend-domain-verification=abc123...

Type: MX
Name: @
Priority: 10
Value: feedback-smtp.us-east-1.amazonses.com

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@resend.com
```

### 3. Vérifier le Domaine

1. Attendez quelques minutes que les DNS se propagent
2. Cliquez sur **Verify** dans Resend
3. Une fois vérifié, mettez à jour `.env.local`:

```env
FROM_EMAIL="noreply@screenapi.com"
# ou
FROM_EMAIL="team@screenapi.com"
# ou
FROM_EMAIL="hello@screenapi.com"
```

---

## 🧪 Tester l'Envoi d'Emails

### Test 1: Email de Bienvenue

```bash
# Créez un compte
curl -X POST http://localhost:43210/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@gmail.com",
    "password": "testpassword123"
  }'
```

Vous devriez recevoir un email de bienvenue! 📧

### Test 2: Email de Paiement (Avec Stripe Test Mode)

1. Créez un compte
2. Allez sur `/pricing`
3. Cliquez sur "Upgrade to Pro"
4. Utilisez la carte de test: `4242 4242 4242 4242`
5. Complétez le paiement
6. Vous recevrez un email de confirmation! 💳

### Test 3: Vérifier dans Resend

1. Allez sur https://resend.com/emails
2. Vous verrez tous les emails envoyés
3. Cliquez sur un email pour voir les détails

---

## 📊 Monitoring

### Dashboard Resend

Le dashboard Resend vous montre:
- ✅ **Emails envoyés** (nombre, taux de succès)
- ✅ **Emails ouverts** (si vous activez le tracking)
- ✅ **Emails en erreur** (bounces, spam, etc.)
- ✅ **Logs détaillés** pour chaque email

### Vérifier les Erreurs

Si un email n'est pas reçu:

1. Vérifiez les logs Resend
2. Vérifiez le dossier spam
3. Vérifiez que `RESEND_API_KEY` est correct dans `.env.local`
4. Vérifiez les logs de votre app:

```bash
# Dans Docker
docker-compose logs app | grep "email"

# Sans Docker
# Cherchez "email" dans les logs de la console
```

---

## 🎨 Personnaliser les Templates

Les templates HTML sont dans `apps/screenapi/src/lib/email.ts`.

### Structure d'un Email

```typescript
export async function sendWelcomeEmail(email: string, name: string) {
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Titre de l\'email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Votre CSS inline ici */
        </style>
      </head>
      <body>
        <!-- Votre HTML ici -->
      </body>
      </html>
    `,
  });
}
```

### Modifier un Template

1. Ouvrez `apps/screenapi/src/lib/email.ts`
2. Trouvez la fonction (ex: `sendWelcomeEmail`)
3. Modifiez le HTML
4. Relancez l'app
5. Testez l'envoi

**Tips:**
- Utilisez CSS inline (pas de `<link>` externe)
- Testez sur plusieurs clients email (Gmail, Outlook, etc.)
- Utilisez des tableaux pour la mise en page (mieux supporté)

---

## 💰 Limites Resend

### Plan Gratuit

- **100 emails/jour**
- **3,000 emails/mois**
- **1 domaine vérifié**
- Support email

**Suffisant pour:** développement, petits projets, tests

### Plan Payant (si besoin)

- **$20/mois** pour 50,000 emails/mois
- Domaines illimités
- Support prioritaire
- Webhooks avancés

---

## 🔐 Sécurité

### Variables d'Environnement

**❌ Ne commitez JAMAIS:**
```env
RESEND_API_KEY="re_abc123..."
```

**✅ Utilisez `.env.local` (ignoré par git)**

### Production

En production (Vercel, Render, etc.):

1. Ajoutez `RESEND_API_KEY` dans les variables d'environnement
2. Ajoutez `FROM_EMAIL` avec votre domaine vérifié
3. Ne partagez jamais votre API key

---

## 🆘 Troubleshooting

### "Resend not configured, skipping email"

➡️ `RESEND_API_KEY` n'est pas dans `.env.local`

**Solution:** Ajoutez la clé dans `.env.local` et relancez l'app

### "Failed to send email: 401 Unauthorized"

➡️ API key invalide ou expirée

**Solution:**
1. Vérifiez que la clé commence par `re_`
2. Créez une nouvelle clé dans Resend
3. Mettez à jour `.env.local`

### "Failed to send email: 403 Forbidden"

➡️ Domaine non vérifié (en production)

**Solution:**
1. Vérifiez votre domaine dans Resend
2. Ou utilisez `onboarding@resend.dev` en dev

### Les emails vont dans spam

➡️ Domaine pas vérifié ou mauvaise réputation

**Solution:**
1. Vérifiez votre domaine avec SPF, DKIM, DMARC
2. Évitez les mots spam dans le sujet ("URGENT", "GRATUIT", etc.)
3. Demandez aux utilisateurs d'ajouter votre email aux contacts

### Les emails n'arrivent pas du tout

**Checklist:**
- [ ] `RESEND_API_KEY` est dans `.env.local`
- [ ] L'app a été relancée après l'ajout de la clé
- [ ] L'email n'est pas dans le spam
- [ ] Vérifiez les logs Resend
- [ ] Vérifiez les logs de l'app

---

## 📚 Ressources

- **Documentation Resend:** https://resend.com/docs
- **API Reference:** https://resend.com/docs/api-reference/emails/send-email
- **Templates:** https://resend.com/docs/dashboard/emails/templates
- **Dashboard:** https://resend.com/emails

---

**C'est tout! Vos emails sont maintenant configurés** 🎉
