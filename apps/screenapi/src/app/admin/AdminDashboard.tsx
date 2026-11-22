'use client';

import { useCallback, useEffect, useState } from 'react';

interface Stats {
  users: { total: number; last7: number; last30: number };
  plans: Record<string, number>;
  paying: number;
  gifted: number;
  mrrEur: number;
  pastDue: number;
  revenueThisMonth: { cents: number; count: number };
  screenshots: { last24h: number; last30d: number; failed30d: number };
  daily: { day: string; ok: number; ko: number }[];
  recentUsers: { id: string; email: string; name: string | null; createdAt: string }[];
  recentPayments: { id: string; amount: number; currency: string; status: string; plan: string; createdAt: string; user: { email: string } }[];
}
interface UserRow {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  subscription: { plan: string; status: string; creditsRemaining: number; creditsTotal: number; stripeSubscriptionId: string | null; stripeCustomerId: string | null } | null;
  keys: number;
  screenshots30d: number;
}

const fmt = (n: number) => n.toLocaleString('fr-FR');
const date = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const PLAN_NAMES: Record<string, string> = { FREE: 'Free', STARTER: 'Starter', GROWTH: 'Growth', SCALE: 'Scale', PRO: 'Growth', ENTERPRISE: 'Scale' };

function Card({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-line p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const loadStats = useCallback(() => fetch('/api/admin/stats').then((r) => r.json()).then(setStats), []);
  const loadUsers = useCallback(() => {
    fetch(`/api/admin/users?q=${encodeURIComponent(query)}&page=${page}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setTotal(d.total || 0); setPages(d.pages || 1); });
  }, [query, page]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function act(u: UserRow, body: Record<string, unknown>, label: string) {
    setMessage('');
    setBusy(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setBusy(null);
    setMessage(res.ok ? `${label} : fait pour ${u.email}.` : `Échec pour ${u.email} : ${data.error}`);
    loadUsers();
    loadStats();
  }

  const maxDay = Math.max(1, ...(stats?.daily.map((d) => d.ok + d.ko) || [1]));
  const failRate = stats && stats.screenshots.last30d + stats.screenshots.failed30d > 0
    ? Math.round((stats.screenshots.failed30d / (stats.screenshots.last30d + stats.screenshots.failed30d)) * 100)
    : 0;

  return (
    <main lang="fr" className="mx-auto max-w-page px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Administration</h1>
          <p className="mt-1 text-sm text-muted">Connecté en tant que {adminEmail}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className="rounded-md border border-line px-3 py-1.5 hover:border-ink">Stripe</a>
          <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="rounded-md border border-line px-3 py-1.5 hover:border-ink">Render</a>
        </div>
      </div>

      <section aria-label="Chiffres clés" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Clients" value={stats ? fmt(stats.users.total) : '—'} note={stats ? `+${stats.users.last7} en 7 jours, +${stats.users.last30} en 30 jours` : ''} />
        <Card label="Clients payants" value={stats ? fmt(stats.paying) : '—'}
          note={stats ? `Starter ${stats.plans.STARTER} · Growth ${stats.plans.GROWTH} · Scale ${stats.plans.SCALE}${stats.gifted ? ` · dont ${stats.gifted} offert(s)` : ''}` : ''} />
        <Card label="Revenu mensuel estimé" value={stats ? `${fmt(stats.mrrEur)} € HT` : '—'}
          note={stats ? `Encaissé ce mois : ${fmt(Math.round(stats.revenueThisMonth.cents / 100))} € (${stats.revenueThisMonth.count} paiements)${stats.pastDue ? ` · ${stats.pastDue} impayé(s)` : ''}` : ''} />
        <Card label="Captures" value={stats ? fmt(stats.screenshots.last24h) : '—'}
          note={stats ? `en 24 h · ${fmt(stats.screenshots.last30d)} en 30 jours · ${failRate} % d'échecs` : ''} />
      </section>

      <section className="mt-8 rounded-lg border border-line p-5">
        <h2 className="font-semibold">Captures par jour (30 jours)</h2>
        <div className="mt-4 flex h-32 items-end gap-1" role="img" aria-label="Captures réussies et en échec par jour sur 30 jours">
          {(stats?.daily || []).map((d) => (
            <div key={d.day} className="flex flex-1 flex-col justify-end" title={`${d.day} : ${d.ok} réussies, ${d.ko} échecs`}>
              {d.ko > 0 && <div className="bg-accent" style={{ height: `${(d.ko / maxDay) * 120}px` }} />}
              <div className="bg-ink" style={{ height: `${Math.max(1, (d.ok / maxDay) * 120)}px` }} />
            </div>
          ))}
          {stats && stats.daily.length === 0 && <p className="text-sm text-muted">Pas encore de captures.</p>}
        </div>
        <p className="mt-2 text-xs text-muted">Noir : réussies · Orange : échecs</p>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold">Clients <span className="text-base font-normal text-muted">({fmt(total)})</span></h2>
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(q.trim()); }} className="flex gap-2">
            <label htmlFor="admin-search" className="sr-only">Rechercher un client</label>
            <input id="admin-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="E-mail ou nom"
              className="rounded-md border border-line px-3 py-1.5 text-sm focus:border-ink focus:outline-none" />
            <button className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white">Rechercher</button>
          </form>
        </div>
        {message && <p role="status" className="mt-3 text-sm">{message}</p>}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="py-2 pr-3 font-semibold">Client</th>
                <th className="py-2 pr-3 font-semibold">Inscrit le</th>
                <th className="py-2 pr-3 font-semibold">Plan</th>
                <th className="py-2 pr-3 text-right font-semibold">Crédits restants</th>
                <th className="py-2 pr-3 text-right font-semibold">Captures 30 j</th>
                <th className="py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const s = u.subscription;
                const suspended = s?.status === 'SUSPENDED';
                return (
                  <tr key={u.id} className="border-b border-line align-top">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium">{u.email}</p>
                      <p className="text-xs text-muted">{u.name || '—'} · {u.keys} clé(s)</p>
                    </td>
                    <td className="py-2.5 pr-3 text-muted">{date(u.createdAt)}</td>
                    <td className="py-2.5 pr-3">
                      {PLAN_NAMES[s?.plan || 'FREE'] || s?.plan}
                      {s?.stripeSubscriptionId && <span className="ml-1 text-xs text-muted">(Stripe)</span>}
                      {s && s.status !== 'ACTIVE' && <span className={`ml-1 text-xs ${suspended || s.status === 'PAST_DUE' ? 'text-red-700' : 'text-muted'}`}>{s.status === 'PAST_DUE' ? 'impayé' : s.status === 'SUSPENDED' ? 'suspendu' : s.status}</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{s ? `${fmt(s.creditsRemaining)} / ${fmt(s.creditsTotal)}` : '—'}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{fmt(u.screenshots30d)}</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`plan-${u.id}`}>Plan de {u.email}</label>
                        <select id={`plan-${u.id}`} disabled={busy === u.id || Boolean(s?.stripeSubscriptionId)}
                          value={PLAN_NAMES[s?.plan || 'FREE'] ? (s?.plan === 'PRO' ? 'GROWTH' : s?.plan === 'ENTERPRISE' ? 'SCALE' : s?.plan || 'FREE') : 'FREE'}
                          title={s?.stripeSubscriptionId ? 'Client Stripe : changer le plan dans Stripe' : 'Changer le plan (offert)'}
                          onChange={(e) => {
                            if (confirm(`Passer ${u.email} au plan ${PLAN_NAMES[e.target.value]} (sans paiement) ?`)) act(u, { action: 'setPlan', plan: e.target.value }, 'Plan changé');
                          }}
                          className="rounded-md border border-line px-2 py-1 text-xs disabled:opacity-50">
                          {['FREE', 'STARTER', 'GROWTH', 'SCALE'].map((p) => <option key={p} value={p}>{PLAN_NAMES[p]}</option>)}
                        </select>
                        <button disabled={busy === u.id} className="rounded-md border border-line px-2 py-1 text-xs hover:border-ink"
                          onClick={() => {
                            const n = Number(prompt(`Combien de captures offrir à ${u.email} ce mois-ci ?`, '500'));
                            if (Number.isInteger(n) && n > 0) act(u, { action: 'addCredits', amount: n }, `${n} captures ajoutées`);
                          }}>
                          + crédits
                        </button>
                        {suspended ? (
                          <button disabled={busy === u.id} onClick={() => act(u, { action: 'reactivate' }, 'Compte réactivé')}
                            className="rounded-md border border-ink px-2 py-1 text-xs">Réactiver</button>
                        ) : (
                          <button disabled={busy === u.id}
                            onClick={() => { if (confirm(`Suspendre ${u.email} ? Ses appels API seront refusés.`)) act(u, { action: 'suspend' }, 'Compte suspendu'); }}
                            className="rounded-md border border-line px-2 py-1 text-xs text-red-700 hover:border-red-700">Suspendre</button>
                        )}
                        {s?.stripeCustomerId && (
                          <a href={`https://dashboard.stripe.com/customers/${s.stripeCustomerId}`} target="_blank" rel="noreferrer" className="text-xs underline">Stripe</a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted">Aucun client trouvé.</td></tr>}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-line px-3 py-1 disabled:opacity-40">Précédent</button>
            <span className="text-muted">Page {page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-md border border-line px-3 py-1 disabled:opacity-40">Suivant</button>
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Derniers paiements</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
            {(stats?.recentPayments || []).map((p) => (
              <li key={p.id} className="flex justify-between gap-3 py-2">
                <span>{p.user.email} · {PLAN_NAMES[p.plan] || p.plan}</span>
                <span className={`tabular-nums ${p.status === 'failed' ? 'text-red-700' : ''}`}>
                  {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()} · {date(p.createdAt)}
                </span>
              </li>
            ))}
            {stats && stats.recentPayments.length === 0 && <li className="py-3 text-muted">Aucun paiement pour l&apos;instant.</li>}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Dernières inscriptions</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
            {(stats?.recentUsers || []).map((u) => (
              <li key={u.id} className="flex justify-between gap-3 py-2">
                <span>{u.email}</span>
                <span className="text-muted">{date(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
