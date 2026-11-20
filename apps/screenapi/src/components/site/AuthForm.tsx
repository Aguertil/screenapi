'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProviders, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PLANS, PAID_PLANS, type PlanId } from '@/lib/plans';

/** Formulaire commun à l'inscription et à la connexion. */
export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const wantedPlan = (params.get('plan') || '').toUpperCase() as PlanId;
  const paid = PAID_PLANS.includes(wantedPlan);
  const next = paid ? `/pricing?plan=${wantedPlan.toLowerCase()}` : params.get('callbackUrl') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('error') ? 'Sign-in failed. Please try again.' : '');
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProviders().then((p) => setOauth(Object.values(p || {}).filter((x) => x.type === 'oauth')));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: name.trim() || email.split('@')[0], email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || data.error || 'The account could not be created.');
          return;
        }
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) setError('Wrong email or password.');
      else router.push(next);
    } finally {
      setLoading(false);
    }
  }

  const title = mode === 'signup' ? 'Create your free account' : 'Sign in';
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted">
        {mode === 'signup'
          ? paid
            ? `Create your account, then you'll pay for the ${PLANS[wantedPlan].name} plan (€${PLANS[wantedPlan].priceEur}/month).`
            : '100 screenshots a month for free. No credit card.'
          : 'Welcome back.'}
      </p>

      {oauth.length > 0 && (
        <div className="mt-8 grid gap-2">
          {oauth.map((p) => (
            <button key={p.id} onClick={() => signIn(p.id, { callbackUrl: next })}
              className="rounded-md border border-line px-4 py-2.5 font-medium hover:border-ink">
              Continue with {p.name}
            </button>
          ))}
          <p className="my-2 text-center text-sm text-muted">or with your email</p>
        </div>
      )}

      <form onSubmit={submit} className="mt-8 grid gap-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="text-sm font-medium">Name <span className="font-normal text-muted">(optional)</span></label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
              className="mt-1 w-full rounded-md border border-line px-3 py-2.5 focus:border-ink focus:outline-none" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            className="mt-1 w-full rounded-md border border-line px-3 py-2.5 focus:border-ink focus:outline-none" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="mt-1 w-full rounded-md border border-line px-3 py-2.5 focus:border-ink focus:outline-none" />
          {mode === 'signup' && <p className="mt-1 text-xs text-muted">At least 8 characters.</p>}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="rounded-md bg-ink px-4 py-2.5 font-medium text-white hover:bg-black disabled:opacity-60">
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
        {mode === 'signup' && (
          <p className="text-xs text-muted">
            By creating an account you accept the <Link href="/terms" className="underline">terms of service</Link> and the{' '}
            <Link href="/privacy" className="underline">privacy policy</Link>.
          </p>
        )}
      </form>

      <p className="mt-8 text-sm text-muted">
        {mode === 'signup' ? (
          <>Already have an account? <Link href={`/auth/signin${paid ? `?plan=${wantedPlan.toLowerCase()}` : ''}`} className="text-ink underline">Sign in</Link></>
        ) : (
          <>New here? <Link href="/auth/signup" className="text-ink underline">Create a free account</Link></>
        )}
      </p>
    </main>
  );
}
