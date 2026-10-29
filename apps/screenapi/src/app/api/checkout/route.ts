import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkoutSchema = z.object({
  plan: z.enum(['PRO', 'ENTERPRISE']),
  promoCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, promoCode } = checkoutSchema.parse(body);

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { subscriptions: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const planConfig = STRIPE_PLANS[plan];
    let discountAmount = 0;
    let promoCodeRecord = null;

    // Validate promo code
    if (promoCode) {
      promoCodeRecord = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
        include: { usages: true },
      });

      if (!promoCodeRecord || !promoCodeRecord.isActive) {
        return NextResponse.json(
          { error: 'Invalid promo code' },
          { status: 400 }
        );
      }

      // Check if already used by this user
      const alreadyUsed = promoCodeRecord.usages.some(
        (usage) => usage.userId === user.id
      );

      if (alreadyUsed) {
        return NextResponse.json(
          { error: 'Promo code already used' },
          { status: 400 }
        );
      }

      // Check if max uses reached
      if (promoCodeRecord.maxUses && promoCodeRecord.usedCount >= promoCodeRecord.maxUses) {
        return NextResponse.json(
          { error: 'Promo code has reached its usage limit' },
          { status: 400 }
        );
      }

      // Check if expired
      if (promoCodeRecord.expiresAt && promoCodeRecord.expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Promo code has expired' },
          { status: 400 }
        );
      }

      // Calculate discount
      if (promoCodeRecord.type === 'PERCENTAGE') {
        discountAmount = Math.floor((planConfig.price * promoCodeRecord.value) / 100);
      } else if (promoCodeRecord.type === 'FIXED_AMOUNT') {
        discountAmount = promoCodeRecord.value;
      }
    }

    const finalAmount = Math.max(0, planConfig.price - discountAmount);

    // Create or get Stripe customer
    let stripeCustomerId = user.subscriptions[0]?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      ...(promoCodeRecord && discountAmount > 0 && {
        discounts: [
          {
            coupon: await createStripeCoupon(promoCodeRecord),
          },
        ],
      }),
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
        promoCodeId: promoCodeRecord?.id || '',
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred during checkout' },
      { status: 500 }
    );
  }
}

// Helper to create Stripe coupon for promo code
async function createStripeCoupon(promoCode: any): Promise<string> {
  const couponId = `promo_${promoCode.code}_${Date.now()}`;

  let couponParams: Stripe.CouponCreateParams;

  if (promoCode.type === 'PERCENTAGE') {
    couponParams = {
      id: couponId,
      percent_off: promoCode.value,
      duration: 'once',
      name: promoCode.description || promoCode.code,
    };
  } else {
    couponParams = {
      id: couponId,
      amount_off: promoCode.value,
      currency: 'usd',
      duration: 'once',
      name: promoCode.description || promoCode.code,
    };
  }

  const coupon = await stripe.coupons.create(couponParams);
  return coupon.id;
}
