import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const STRIPE_PLANS = {
  PRO: {
    name: 'Pro',
    price: 4900, // $49 in cents
    credits: 10000,
    rateLimit: 100,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 29900, // $299 in cents
    credits: 100000,
    rateLimit: 1000,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  },
};
