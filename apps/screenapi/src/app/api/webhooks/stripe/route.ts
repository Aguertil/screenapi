import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';
import { prisma } from '@repo/database';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as 'PRO' | 'ENTERPRISE';
  const promoCodeId = session.metadata?.promoCodeId;

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const planConfig = STRIPE_PLANS[plan];

  // Update or create subscription
  await prisma.subscription.upsert({
    where: {
      stripeCustomerId: session.customer as string,
    },
    update: {
      plan,
      status: 'ACTIVE',
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      creditsTotal: planConfig.credits,
      creditsUsed: 0,
      creditsRemaining: planConfig.credits,
    },
    create: {
      userId,
      plan,
      status: 'ACTIVE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      creditsTotal: planConfig.credits,
      creditsUsed: 0,
      creditsRemaining: planConfig.credits,
    },
  });

  // Update API key rate limit
  await prisma.apiKey.updateMany({
    where: { userId },
    data: {
      rateLimit: planConfig.rateLimit,
    },
  });

  // Record payment
  await prisma.payment.create({
    data: {
      userId,
      stripePaymentId: session.payment_intent as string,
      amount: session.amount_total || 0,
      currency: session.currency || 'usd',
      status: 'succeeded',
      plan,
      promoCodeId: promoCodeId || null,
      description: `${plan} subscription`,
    },
  });

  // Record promo code usage
  if (promoCodeId) {
    await prisma.promoCodeUsage.create({
      data: {
        userId,
        promoCodeId,
      },
    });

    await prisma.promoCode.update({
      where: { id: promoCodeId },
      data: {
        usedCount: { increment: 1 },
      },
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: subscription.status === 'active' ? 'ACTIVE' : subscription.status.toUpperCase(),
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: 'CANCELED',
    },
  });

  // Downgrade to FREE plan
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (sub) {
    await prisma.subscription.create({
      data: {
        userId: sub.userId,
        plan: 'FREE',
        status: 'ACTIVE',
        creditsTotal: 100,
        creditsUsed: 0,
        creditsRemaining: 100,
      },
    });

    await prisma.apiKey.updateMany({
      where: { userId: sub.userId },
      data: {
        rateLimit: 10,
      },
    });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
    },
  });

  if (!subscription) return;

  // Reset credits on successful payment
  const planConfig = STRIPE_PLANS[subscription.plan as keyof typeof STRIPE_PLANS];

  if (planConfig) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        creditsTotal: planConfig.credits,
        creditsUsed: 0,
        creditsRemaining: planConfig.credits,
      },
    });
  }

  // Record payment
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      stripePaymentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      plan: subscription.plan,
      description: `${subscription.plan} subscription renewal`,
      receiptUrl: invoice.hosted_invoice_url || undefined,
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
    },
  });

  if (!subscription) return;

  // Mark subscription as past due
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PAST_DUE',
    },
  });

  // Record failed payment
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      stripePaymentId: invoice.payment_intent as string || `failed_${Date.now()}`,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      plan: subscription.plan,
      description: `Failed payment for ${subscription.plan} subscription`,
    },
  });
}
