import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@repo/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        screenshotUsageLogs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const subscription = user.subscriptions[0];

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 404 }
      );
    }

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = user.screenshotUsageLogs.filter(
      (log) => log.createdAt >= today
    );

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthLogs = user.screenshotUsageLogs.filter(
      (log) => log.createdAt >= thisMonth
    );

    const successfulToday = todayLogs.filter((log) => log.status === 'SUCCESS').length;
    const failedToday = todayLogs.filter((log) => log.status === 'FAILED').length;

    const successfulThisMonth = thisMonthLogs.filter((log) => log.status === 'SUCCESS').length;
    const failedThisMonth = thisMonthLogs.filter((log) => log.status === 'FAILED').length;

    // Group by day for chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLogs = user.screenshotUsageLogs.filter(
        (log) => log.createdAt >= date && log.createdAt < nextDate
      );

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count: dayLogs.length,
        successful: dayLogs.filter((log) => log.status === 'SUCCESS').length,
        failed: dayLogs.filter((log) => log.status === 'FAILED').length,
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        creditsTotal: subscription.creditsTotal,
        creditsUsed: subscription.creditsUsed,
        creditsRemaining: subscription.creditsRemaining,
        currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      usage: {
        today: {
          total: todayLogs.length,
          successful: successfulToday,
          failed: failedToday,
        },
        thisMonth: {
          total: thisMonthLogs.length,
          successful: successfulThisMonth,
          failed: failedThisMonth,
        },
        last7Days,
      },
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage statistics' },
      { status: 500 }
    );
  }
}
