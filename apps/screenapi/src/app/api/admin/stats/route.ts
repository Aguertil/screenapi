import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { PLANS, getPlan } from '@/lib/plans';

export const dynamic = 'force-dynamic';

/** GET /api/admin/stats — chiffres clés de l'activité. */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const now = Date.now();
  const d1 = new Date(now - 86400_000);
  const d7 = new Date(now - 7 * 86400_000);
  const d30 = new Date(now - 30 * 86400_000);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [users, users7, users30, subs, shots1, shots30, failed30, payMonth, recentUsers, recentPayments, daily] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.subscription.findMany({ where: { status: { in: ['ACTIVE', 'PAST_DUE', 'SUSPENDED'] } }, select: { userId: true, plan: true, status: true, createdAt: true, stripeSubscriptionId: true }, orderBy: { createdAt: 'desc' } }),
    prisma.screenshotUsageLog.count({ where: { createdAt: { gte: d1 }, status: 'SUCCESS' } }),
    prisma.screenshotUsageLog.count({ where: { createdAt: { gte: d30 }, status: 'SUCCESS' } }),
    prisma.screenshotUsageLog.count({ where: { createdAt: { gte: d30 }, status: 'FAILED' } }),
    prisma.payment.aggregate({ where: { createdAt: { gte: monthStart }, status: 'succeeded' }, _sum: { amount: true }, _count: true }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, email: true, name: true, createdAt: true } }),
    prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, amount: true, currency: true, status: true, plan: true, createdAt: true, user: { select: { email: true } } } }),
    prisma.$queryRaw<{ day: Date; ok: bigint; ko: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day,
             count(*) FILTER (WHERE status = 'SUCCESS') AS ok,
             count(*) FILTER (WHERE status = 'FAILED') AS ko
      FROM screenshot_usage_logs WHERE "createdAt" >= ${d30}
      GROUP BY 1 ORDER BY 1`,
  ]);

  // Un abonnement par client (le plus récent)
  const latest = new Map<string, { plan: string; status: string; stripeSubscriptionId: string | null }>();
  for (const s of subs) if (!latest.has(s.userId)) latest.set(s.userId, s);
  const byPlan: Record<string, number> = { FREE: 0, STARTER: 0, GROWTH: 0, SCALE: 0 };
  let mrr = 0;
  let pastDue = 0;
  let paying = 0;
  let gifted = 0;
  for (const s of latest.values()) {
    const plan = getPlan(s.plan);
    byPlan[plan.id] = (byPlan[plan.id] || 0) + 1;
    if (plan.priceEur === 0) continue;
    // Seuls les abonnements Stripe rapportent ; les plans changés à la main sont offerts
    if (s.stripeSubscriptionId && (s.status === 'ACTIVE' || s.status === 'PAST_DUE')) {
      mrr += plan.priceEur;
      paying++;
    } else gifted++;
    if (s.status === 'PAST_DUE') pastDue++;
  }

  return NextResponse.json({
    users: { total: users, last7: users7, last30: users30 },
    plans: byPlan,
    paying,
    gifted,
    mrrEur: mrr,
    pastDue,
    revenueThisMonth: { cents: payMonth._sum.amount || 0, count: payMonth._count },
    screenshots: { last24h: shots1, last30d: shots30, failed30d: failed30 },
    daily: daily.map((d) => ({ day: d.day.toISOString().slice(0, 10), ok: Number(d.ok), ko: Number(d.ko) })),
    recentUsers,
    recentPayments,
    planPrices: Object.fromEntries(Object.values(PLANS).map((p) => [p.id, p.priceEur])),
  });
}
