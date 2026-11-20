/**
 * Offre ScreenAPI : une seule source de vérité pour les quotas, les limites
 * et les prix (affichés sur le site, appliqués par l'API, vendus par Stripe).
 * Les quotas sont mensuels. Les captures servies depuis le cache sont gratuites.
 */
export type PlanId = 'FREE' | 'STARTER' | 'GROWTH' | 'SCALE';

export interface Plan {
  id: PlanId;
  name: string;
  priceEur: number; // HT, par mois
  screenshots: number; // par mois
  ratePerMinute: number;
  features: string[];
  stripePriceEnv?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    priceEur: 0,
    screenshots: 100,
    ratePerMinute: 10,
    features: ['100 screenshots / month', 'PNG, JPEG, WebP, PDF', 'All options included', 'No credit card'],
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    priceEur: 9,
    screenshots: 2_500,
    ratePerMinute: 30,
    features: ['2,500 screenshots / month', 'Everything in Free', 'Cached hits are free', 'Email support'],
    stripePriceEnv: 'STRIPE_PRICE_STARTER',
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth',
    priceEur: 29,
    screenshots: 12_000,
    ratePerMinute: 60,
    features: ['12,000 screenshots / month', 'Everything in Starter', 'Higher rate limit', 'Priority email support'],
    stripePriceEnv: 'STRIPE_PRICE_GROWTH',
  },
  SCALE: {
    id: 'SCALE',
    name: 'Scale',
    priceEur: 79,
    screenshots: 50_000,
    ratePerMinute: 120,
    features: ['50,000 screenshots / month', 'Everything in Growth', 'Highest rate limit', 'Invoice on request'],
    stripePriceEnv: 'STRIPE_PRICE_SCALE',
  },
};

export const PAID_PLANS: PlanId[] = ['STARTER', 'GROWTH', 'SCALE'];

/** Anciens noms de plans (avant novembre 2026) */
const LEGACY: Record<string, PlanId> = { PRO: 'GROWTH', ENTERPRISE: 'SCALE' };

export function getPlan(id: string | null | undefined): Plan {
  const key = (id || 'FREE').toUpperCase();
  return PLANS[(LEGACY[key] || key) as PlanId] || PLANS.FREE;
}

export function stripePriceId(plan: PlanId): string | undefined {
  const env = PLANS[plan].stripePriceEnv;
  return env ? process.env[env] : undefined;
}

export function planFromStripePrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const id of PAID_PLANS) if (stripePriceId(id) === priceId) return id;
  return null;
}
