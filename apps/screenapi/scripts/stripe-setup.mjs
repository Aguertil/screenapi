/**
 * Configure Stripe pour ScreenAPI (à lancer une fois, en test puis en production) :
 *   docker compose exec app node scripts/stripe-setup.mjs
 * Crée (ou retrouve) les 3 prix mensuels en euros, le webhook et le portail client,
 * puis affiche les lignes à coller dans deploy/.env.
 * Relançable sans risque : rien n'est créé en double.
 */
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
const domain = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
if (!key) throw new Error('STRIPE_SECRET_KEY manquant dans deploy/.env');
if (!domain || domain.includes('localhost')) throw new Error('Adresse publique du site manquante (DOMAIN dans deploy/.env)');

const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
const mode = key.startsWith('sk_live') ? 'PRODUCTION' : 'TEST';

const PLANS = [
  { id: 'STARTER', name: 'ScreenAPI Starter', cents: 900, desc: '2,500 screenshots per month' },
  { id: 'GROWTH', name: 'ScreenAPI Growth', cents: 2900, desc: '12,000 screenshots per month' },
  { id: 'SCALE', name: 'ScreenAPI Scale', cents: 7900, desc: '50,000 screenshots per month' },
];

const env = {};
const prices = [];
for (const plan of PLANS) {
  const lookup = `screenapi_${plan.id.toLowerCase()}_monthly_eur`;
  let price = (await stripe.prices.list({ lookup_keys: [lookup], active: true })).data[0];
  if (!price) {
    const product = await stripe.products.create({ name: plan.name, description: plan.desc, metadata: { plan: plan.id } });
    price = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: plan.cents,
      recurring: { interval: 'month' },
      tax_behavior: 'exclusive',
      lookup_key: lookup,
      metadata: { plan: plan.id },
    });
    console.log(`+ prix ${plan.id} créé`);
  } else {
    console.log(`= prix ${plan.id} déjà présent`);
  }
  env[`STRIPE_PRICE_${plan.id}`] = price.id;
  prices.push(price);
}

// Webhook
const url = `${domain.replace(/\/$/, '')}/api/webhooks/stripe`;
const events = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];
const existing = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find((w) => w.url === url);
if (existing) {
  await stripe.webhookEndpoints.update(existing.id, { enabled_events: events });
  console.log(`= webhook déjà présent (${url}). Son secret n'est visible que dans le tableau de bord Stripe.`);
} else {
  const hook = await stripe.webhookEndpoints.create({ url, enabled_events: events, description: 'ScreenAPI' });
  env.STRIPE_WEBHOOK_SECRET = hook.secret;
  console.log(`+ webhook créé : ${url}`);
}

// Portail client : factures, carte, changement de plan, résiliation en fin de mois
const products = [...new Set(prices.map((p) => p.product))];
await stripe.billingPortal.configurations.create({
  business_profile: { headline: 'ScreenAPI — manage your subscription', privacy_policy_url: `${domain}/privacy`, terms_of_service_url: `${domain}/terms` },
  features: {
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    customer_update: { enabled: true, allowed_updates: ['email', 'address', 'tax_id', 'name'] },
    subscription_cancel: { enabled: true, mode: 'at_period_end' },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',
      products: products.map((product) => ({ product, prices: prices.filter((p) => p.product === product).map((p) => p.id) })),
    },
  },
  default_return_url: `${domain}/dashboard`,
}).then((c) => stripe.billingPortal.configurations.update(c.id, { active: true }));
console.log('+ portail client configuré');

console.log(`\nMode ${mode}. Lignes à mettre dans deploy/.env :\n`);
for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
console.log('\nPuis : cd /opt/screenapi/deploy && docker compose up -d');
