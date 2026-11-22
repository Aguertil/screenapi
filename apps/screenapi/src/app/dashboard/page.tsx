'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { getPlan } from '@/lib/plans';

interface Usage {
  subscription: { plan: string; status: string; creditsTotal: number; creditsUsed: number; creditsRemaining: number; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean };
  usage: { today: { total: number; successful: number; failed: number }; thisMonth: { total: number; successful: number; failed: number }; last7Days: { date: string; count: number }[] };
}
interface ApiKey { id: string; name: string; key: string; isActive: boolean; lastUsedAt: string | null; createdAt: string }

const BASE = process.env.NEXT_PUBLIC_APP_URL || '';

function Dashboard() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newName, setNewName] = useState('');
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [u, k] = await Promise.all([fetch('/api/usage').then((r) => r.json()), fetch('/api/keys').then((r) => r.json())]);
    if (u.success) setUsage(u);
    if (k.success) setKeys(k.keys);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch('/api/keys', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: newName.trim() || 'Default' }) });
    const data = await res.json();
    setBusy(false);
    if (!data.success) return setError(data.error || 'The key could not be created.');
    setFreshKey(data.key.key);
    setCopied(false);
    setNewName('');
    load();
  }

  async function revokeKey(key: ApiKey) {
    if (!confirm(`Revoke the key "${key.name}"? Apps using it will stop working.`)) return;
    await fetch(`/api/keys/${key.id}`, { method: 'DELETE' });
    load();
  }

  async function billing() {
    const res = await fetch('/api/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setError(data.error || 'Billing page unavailable.');
  }

  const plan = getPlan(usage?.subscription.plan);
  const sub = usage?.subscription;
  const usedPct = sub && sub.creditsTotal ? Math.min(100, Math.round((sub.creditsUsed / sub.creditsTotal) * 100)) : 0;
  const max7 = Math.max(1, ...(usage?.usage.last7Days.map((d) => d.count) || [1]));

  return (
    <main className="mx-auto max-w-page px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted">{session?.user?.email}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-muted hover:text-ink">Sign out</button>
      </div>

      {params.get('upgraded') && (
        <p className="mt-6 rounded-md border border-ink px-4 py-3 text-sm">Thank you! Your plan is active. It can take a few seconds to show here.</p>
      )}
      {sub?.status === 'PAST_DUE' && (
        <p className="mt-6 rounded-md border border-red-700 px-4 py-3 text-sm text-red-700">
          Your last payment failed. Update your card in billing to keep your plan.
        </p>
      )}
      {sub?.status === 'SUSPENDED' && (
        <p className="mt-6 rounded-md border border-red-700 px-4 py-3 text-sm text-red-700">
          Your account is suspended: the API refuses your requests. Contact support to reactivate it.
        </p>
      )}
      {error && <p role="alert" className="mt-6 text-sm text-red-700">{error}</p>}

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-line p-6">
          <p className="text-sm text-muted">Plan</p>
          <p className="mt-1 text-2xl font-semibold">{plan.name}{plan.priceEur > 0 && <span className="text-base font-normal text-muted"> · €{plan.priceEur}/month</span>}</p>
          {sub?.cancelAtPeriodEnd && sub.currentPeriodEnd && (
            <p className="mt-1 text-sm text-muted">Ends on {new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB')}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/pricing" className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-black">
              {plan.id === 'FREE' ? 'Upgrade' : 'Change plan'}
            </Link>
            {plan.id !== 'FREE' && (
              <button onClick={billing} className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:border-ink">
                Billing & invoices
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line p-6">
          <p className="text-sm text-muted">Screenshots this month</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {sub ? sub.creditsUsed.toLocaleString('en-US') : '—'}
            <span className="text-base font-normal text-muted"> / {sub ? sub.creditsTotal.toLocaleString('en-US') : '—'}</span>
          </p>
          <div className="mt-4 h-2 rounded-full bg-surface" role="progressbar" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Quota used">
            <div className={`h-2 rounded-full ${usedPct >= 90 ? 'bg-accent' : 'bg-ink'}`} style={{ width: `${usedPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">{sub ? `${sub.creditsRemaining.toLocaleString('en-US')} left` : ''}</p>
        </div>

        <div className="rounded-lg border border-line p-6">
          <p className="text-sm text-muted">Last 7 days</p>
          <div className="mt-3 flex h-16 items-end gap-1.5" aria-label="Requests per day over the last 7 days">
            {(usage?.usage.last7Days || []).map((d) => (
              <div key={d.date} className="flex-1" title={`${d.date}: ${d.count}`}>
                <div className="rounded-sm bg-ink" style={{ height: `${Math.max(2, (d.count / max7) * 64)}px` }} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">
            Today: {usage?.usage.today.successful ?? 0} ok, {usage?.usage.today.failed ?? 0} failed
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">API keys</h2>
        {freshKey && (
          <div className="mt-4 rounded-lg border-2 border-accent p-5">
            <p className="font-medium">Your new key. Copy it now: it will not be shown again.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 break-all rounded-md bg-surface px-3 py-2 text-sm">{freshKey}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(freshKey); setCopied(true); }}
                className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">Try it:</p>
            <pre className="mt-1 overflow-x-auto rounded-md bg-ink p-3 text-xs text-white"><code>{`curl "${BASE || window.location.origin}/api/v1/screenshot?url=https://example.com" -H "x-api-key: ${freshKey}" -o shot.png`}</code></pre>
          </div>
        )}

        <form onSubmit={createKey} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="key-name" className="sr-only">Key name</label>
          <input id="key-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Key name, e.g. production"
            className="flex-1 rounded-md border border-line px-3 py-2 focus:border-ink focus:outline-none" />
          <button disabled={busy} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {busy ? 'Creating…' : 'Create key'}
          </button>
        </form>

        <div className="mt-4 divide-y divide-line border-y border-line">
          {keys.length === 0 && <p className="py-4 text-sm text-muted">No key yet. Create one to start.</p>}
          {keys.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium">{k.name}</p>
                <p className="text-sm text-muted"><code>{k.key}</code> · {k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleDateString('en-GB')}` : 'never used'}</p>
              </div>
              <button onClick={() => revokeKey(k)} className="text-sm text-muted hover:text-red-700">Revoke</button>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-muted">
        Need help? Read the <Link href="/docs" className="text-ink underline underline-offset-4">documentation</Link>.
      </p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <Suspense>
        <Dashboard />
      </Suspense>
    </>
  );
}
