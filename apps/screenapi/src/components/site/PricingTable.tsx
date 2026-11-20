'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PLANS, type PlanId } from '@/lib/plans';

const ORDER: PlanId[] = ['FREE', 'STARTER', 'GROWTH', 'SCALE'];
const fmt = (n: number) => n.toLocaleString('en-US');

export function PricingTable({ currentPlan, autoPlan }: { currentPlan?: string; autoPlan?: string }) {
  const { status } = useSession();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState('');

  async function upgrade(plan: PlanId) {
    setError('');
    setBusy(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Payment could not be started.');
    } catch {
      setError('Payment could not be started.');
    } finally {
      setBusy(null);
    }
  }

  // Arrivée depuis l'inscription avec un plan choisi : ouvrir le paiement directement
  const started = useRef(false);
  useEffect(() => {
    const wanted = (autoPlan || '').toUpperCase() as PlanId;
    if (!started.current && status === 'authenticated' && PLANS[wanted] && wanted !== 'FREE' && wanted !== currentPlan) {
      started.current = true;
      upgrade(wanted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, autoPlan, currentPlan]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((id) => {
          const plan = PLANS[id];
          const highlight = id === 'GROWTH';
          const isCurrent = currentPlan === id;
          return (
            <div
              key={id}
              className={`flex flex-col rounded-lg border p-6 ${highlight ? 'border-ink ring-1 ring-ink' : 'border-line'}`}
            >
              <h3 className="text-base font-semibold">{plan.name}</h3>
              <p className="mt-3">
                <span className="text-4xl font-semibold tracking-tight">€{plan.priceEur}</span>
                <span className="text-sm text-muted"> / month</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                {fmt(plan.screenshots)} screenshots
                {plan.priceEur > 0 && <> · €{((plan.priceEur / plan.screenshots) * 1000).toFixed(2)} per 1,000</>}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-accent" />
                    {f}
                  </li>
                ))}
                <li className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-accent" />
                  {plan.ratePerMinute} requests / minute
                </li>
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <p className="rounded-md border border-line px-4 py-2 text-center text-sm text-muted">Your plan</p>
                ) : id === 'FREE' ? (
                  <Link
                    href="/auth/signup"
                    className="block rounded-md border border-ink px-4 py-2 text-center text-sm font-medium hover:bg-surface"
                  >
                    Start free
                  </Link>
                ) : status === 'authenticated' ? (
                  <button
                    onClick={() => upgrade(id)}
                    disabled={busy !== null}
                    className={`w-full rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                      highlight ? 'bg-accent text-white hover:brightness-95' : 'bg-ink text-white hover:bg-black'
                    }`}
                  >
                    {busy === id ? 'Opening payment…' : `Choose ${plan.name}`}
                  </button>
                ) : (
                  <Link
                    href={`/auth/signup?plan=${id.toLowerCase()}`}
                    className={`block rounded-md px-4 py-2 text-center text-sm font-medium ${
                      highlight ? 'bg-accent text-white hover:brightness-95' : 'bg-ink text-white hover:bg-black'
                    }`}
                  >
                    Choose {plan.name}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <p className="mt-4 text-sm text-muted">
        Prices excl. VAT, billed monthly in euros. Cancel anytime from your dashboard. Screenshots served from cache don&apos;t count.
      </p>
    </div>
  );
}
