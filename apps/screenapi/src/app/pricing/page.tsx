import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { PricingTable } from '@/components/site/PricingTable';
import { getPlan } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Screenshot API pricing in euros: 100 free screenshots a month, then €9, €29 or €79 a month. No overage fees.',
};

export const dynamic = 'force-dynamic';

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ canceled?: string; plan?: string }> }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  let current: string | undefined;
  if (session?.user?.email) {
    const sub = await prisma.subscription.findFirst({
      where: { user: { email: session.user.email }, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
    });
    current = sub ? getPlan(sub.plan).id : 'FREE';
  }
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-page px-5 py-14">
        <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Every option is included in every plan. Pick the number of screenshots you need each month.
        </p>
        {params.canceled && (
          <p className="mt-6 rounded-md border border-line bg-surface px-4 py-3 text-sm">Payment canceled. Nothing was charged.</p>
        )}
        <div className="mt-10"><PricingTable currentPlan={current} autoPlan={params.plan} /></div>
        <div className="mt-14 grid gap-8 border-t border-line pt-10 text-sm sm:grid-cols-3">
          <div><h2 className="font-semibold">No overage fees</h2><p className="mt-2 text-muted">When the quota is used up, the API stops answering with a clear error. You choose whether to upgrade.</p></div>
          <div><h2 className="font-semibold">Change plan anytime</h2><p className="mt-2 text-muted">Upgrades apply immediately with a prorated charge. Downgrades and cancellations apply at the end of the month.</p></div>
          <div><h2 className="font-semibold">Need more?</h2><p className="mt-2 text-muted">For more than 50,000 screenshots a month, write to us for a custom quote.</p></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
