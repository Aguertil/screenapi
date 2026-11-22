import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/** GET /api/admin/users?q=…&page=1 — liste des clients avec plan et usage. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const q = request.nextUrl.searchParams.get('q')?.trim() || '';
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1);
  const take = 25;
  const where = q
    ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { name: { contains: q, mode: 'insensitive' as const } }] }
    : {};
  const d30 = new Date(Date.now() - 30 * 86400_000);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { plan: true, status: true, creditsRemaining: true, creditsTotal: true, stripeSubscriptionId: true, stripeCustomerId: true },
        },
        _count: { select: { apiKeys: true, screenshotUsageLogs: { where: { createdAt: { gte: d30 }, status: 'SUCCESS' } } } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / take)),
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      subscription: u.subscriptions[0] || null,
      keys: u._count.apiKeys,
      screenshots30d: u._count.screenshotUsageLogs,
    })),
  });
}
