import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { PLANS, type PlanId } from '@/lib/plans';

export const dynamic = 'force-dynamic';

const actionSchema = z.discriminatedUnion('action', [
  // Plan offert ou corrigé à la main (sans Stripe) : quota du plan, remis à zéro
  z.object({ action: z.literal('setPlan'), plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'SCALE']) }),
  // Captures offertes en plus pour ce mois
  z.object({ action: z.literal('addCredits'), amount: z.number().int().min(1).max(1_000_000) }),
  z.object({ action: z.literal('suspend') }),
  z.object({ action: z.literal('reactivate') }),
]);

/** POST /api/admin/users/:id { action, … } — actions de gestion sur un client. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  const body = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  let sub = user.subscriptions[0];
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId: id, plan: 'FREE', status: 'ACTIVE', creditsTotal: 100, creditsUsed: 0, creditsRemaining: 100 },
    });
  }

  switch (body.action) {
    case 'setPlan': {
      if (sub.stripeSubscriptionId && body.plan !== sub.plan) {
        return NextResponse.json(
          { error: 'This customer pays through Stripe: change the plan in the Stripe dashboard so billing stays correct.' },
          { status: 409 },
        );
      }
      const plan = PLANS[body.plan as PlanId];
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { plan: plan.id, status: 'ACTIVE', creditsTotal: plan.screenshots, creditsUsed: 0, creditsRemaining: plan.screenshots, periodStart: new Date() },
      });
      await prisma.apiKey.updateMany({ where: { userId: id }, data: { rateLimit: plan.ratePerMinute } });
      break;
    }
    case 'addCredits':
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { creditsRemaining: { increment: body.amount }, creditsTotal: { increment: body.amount } },
      });
      break;
    case 'suspend':
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'SUSPENDED' } });
      break;
    case 'reactivate':
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'ACTIVE' } });
      break;
  }

  console.log(`[admin] ${admin.email} → ${body.action} on ${user.email}`);
  const updated = await prisma.subscription.findUnique({ where: { id: sub.id } });
  return NextResponse.json({ success: true, subscription: updated });
}
