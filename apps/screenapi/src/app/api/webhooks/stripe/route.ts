import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getPlan, planFromStripePrice, PLANS, type PlanId } from '@/lib/plans';
import { sendPaymentSuccessEmail, sendPaymentFailedEmail, sendSubscriptionCancelledEmail } from '@/lib/email';

/**
 * Webhook Stripe : source de vérité de l'abonnement de chaque client.
 * Événements à cocher dans Stripe : checkout.session.completed,
 * customer.subscription.updated, customer.subscription.deleted,
 * invoice.payment_succeeded, invoice.payment_failed.
 * Chaque traitement est idempotent (Stripe peut renvoyer un événement).
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await syncSubscription(sub, session.metadata?.userId, true);
        }
        break;
      }
      case 'customer.subscription.updated':
        await syncSubscription(event.data.object as Stripe.Subscription, undefined, false);
        break;
      case 'customer.subscription.deleted':
        await handleDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Webhook ${event.type} failed:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

const statusOf = (s: Stripe.Subscription) =>
  s.status === 'active' || s.status === 'trialing' ? 'ACTIVE' : s.status === 'past_due' ? 'PAST_DUE' : s.status.toUpperCase();

/** Crée ou met à jour l'abonnement local d'après l'abonnement Stripe. */
async function syncSubscription(sub: Stripe.Subscription, userIdHint: string | undefined, isNew: boolean) {
  const priceId = sub.items.data[0]?.price.id;
  const plan: PlanId = planFromStripePrice(priceId) || (getPlan(sub.metadata?.plan).id as PlanId);
  const quota = PLANS[plan].screenshots;
  const customerId = sub.customer as string;

  let local = await prisma.subscription.findFirst({
    where: { OR: [{ stripeSubscriptionId: sub.id }, { stripeCustomerId: customerId }] },
    orderBy: { createdAt: 'desc' },
  });
  const userId = local?.userId || userIdHint || sub.metadata?.userId;
  if (!userId) {
    console.error('Stripe subscription without user', sub.id);
    return;
  }
  if (!local) {
    local = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  const planChanged = !local || local.plan !== plan || local.stripeSubscriptionId !== sub.id;
  const data = {
    plan,
    status: statusOf(sub),
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    // Nouveau plan : quota du nouveau plan tout de suite
    ...(planChanged ? { creditsTotal: quota, creditsUsed: 0, creditsRemaining: quota, periodStart: new Date() } : {}),
  };

  if (local) await prisma.subscription.update({ where: { id: local.id }, data });
  else await prisma.subscription.create({ data: { userId, ...data, creditsTotal: quota, creditsUsed: 0, creditsRemaining: quota } });

  await prisma.apiKey.updateMany({ where: { userId }, data: { rateLimit: PLANS[plan].ratePerMinute } });

  if (isNew) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      sendPaymentSuccessEmail(user.email, user.name || 'there', PLANS[plan].name, PLANS[plan].priceEur * 100)
        .catch((e) => console.error('Payment email failed:', e));
    }
  }
}

/** Abonnement terminé : retour au plan gratuit. */
async function handleDeleted(sub: Stripe.Subscription) {
  const local = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
  if (!local || local.plan === 'FREE') return;
  const free = PLANS.FREE;
  await prisma.subscription.update({
    where: { id: local.id },
    data: {
      plan: 'FREE',
      status: 'ACTIVE',
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      creditsTotal: free.screenshots,
      creditsUsed: 0,
      creditsRemaining: free.screenshots,
      periodStart: new Date(),
    },
  });
  await prisma.apiKey.updateMany({ where: { userId: local.userId }, data: { rateLimit: free.ratePerMinute } });
  const user = await prisma.user.findUnique({ where: { id: local.userId } });
  if (user) sendSubscriptionCancelledEmail(user.email, user.name || 'there').catch(() => {});
}

/** Facture payée (chaque mois) : quota remis à zéro et paiement enregistré une fois. */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  const local = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: invoice.subscription as string } });
  if (!local) return; // checkout.session.completed s'en charge

  const already = await prisma.payment.findFirst({ where: { stripeInvoiceId: invoice.id } });
  if (already) return;

  const quota = getPlan(local.plan).screenshots;
  if (invoice.billing_reason === 'subscription_cycle') {
    await prisma.subscription.update({
      where: { id: local.id },
      data: { status: 'ACTIVE', creditsTotal: quota, creditsUsed: 0, creditsRemaining: quota, periodStart: new Date() },
    });
  } else if (local.status === 'PAST_DUE') {
    await prisma.subscription.update({ where: { id: local.id }, data: { status: 'ACTIVE' } });
  }

  await prisma.payment.create({
    data: {
      userId: local.userId,
      stripePaymentId: (invoice.payment_intent as string) || invoice.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      plan: local.plan,
      description: `${getPlan(local.plan).name} plan`,
      receiptUrl: invoice.hosted_invoice_url || undefined,
    },
  });
}

/** Paiement refusé : l'API reste ouverte pendant les relances Stripe (statut PAST_DUE). */
async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  const local = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: invoice.subscription as string } });
  if (!local) return;
  await prisma.subscription.update({ where: { id: local.id }, data: { status: 'PAST_DUE' } });
  const user = await prisma.user.findUnique({ where: { id: local.userId } });
  if (user) sendPaymentFailedEmail(user.email, user.name || 'there', 'Your card was declined.').catch(() => {});
}
