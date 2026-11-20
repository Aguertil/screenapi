import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { stripe, stripeConfigured } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { PAID_PLANS, stripePriceId, type PlanId } from '@/lib/plans';

const checkoutSchema = z.object({
  plan: z.enum(PAID_PLANS as [PlanId, ...PlanId[]]),
});

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:43210';

/**
 * POST /api/checkout { plan } → URL de paiement Stripe (abonnement mensuel en euros).
 * Codes promo : gérés dans Stripe (« Promotion codes »), saisis sur la page de paiement.
 * Un client déjà abonné est envoyé vers le portail Stripe pour changer de plan.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let plan: PlanId;
  try {
    ({ plan } = checkoutSchema.parse(await request.json()));
  } catch {
    return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
  }

  const priceId = stripePriceId(plan);
  if (!stripeConfigured() || !priceId) {
    return NextResponse.json({ error: 'Payments are not open yet. Please contact us.' }, { status: 503 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscriptions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const current = user.subscriptions.find((s) => s.status === 'ACTIVE' || s.status === 'PAST_DUE');
    let customerId = user.subscriptions.find((s) => s.stripeCustomerId)?.stripeCustomerId || null;

    // Déjà abonné : changement de plan dans le portail Stripe (prorata géré par Stripe)
    if (current?.stripeSubscriptionId && customerId) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl()}/dashboard`,
      });
      return NextResponse.json({ url: portal.url });
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      if (current) {
        await prisma.subscription.update({ where: { id: current.id }, data: { stripeCustomerId: customerId } });
      }
    }

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === 'true' },
      subscription_data: { metadata: { userId: user.id, plan } },
      success_url: `${appUrl()}/dashboard?upgraded=${plan.toLowerCase()}`,
      cancel_url: `${appUrl()}/pricing?canceled=true`,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Payment could not be started. Please try again.' }, { status: 500 });
  }
}
