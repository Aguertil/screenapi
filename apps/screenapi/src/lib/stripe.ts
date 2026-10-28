import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
