import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Privacy policy' };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="20 November 2026">
      <p>
        The data controller is {COMPANY.name}, {COMPANY.address}. Contact for any question or request:{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>

      <h2>What we collect and why</h2>
      <ul>
        <li><strong>Account</strong>: email, name, password (stored hashed), or your Google/GitHub identifier if you sign in with them. Purpose: providing the service (contract). Kept while the account exists.</li>
        <li><strong>Billing</strong>: plan, invoices, payment status. Card data is handled by Stripe and never reaches us. Purpose: billing and accounting (legal obligation). Kept 10 years.</li>
        <li><strong>Usage logs</strong>: requested URL, date, status, size, IP address of the caller. Purpose: usage history, quotas, abuse prevention (contract and legitimate interest). Kept 90 days.</li>
        <li><strong>Screenshots</strong>: returned to you and not stored. A copy may stay in memory for the cache time you choose, at most 30 days, and disappears on restart.</li>
      </ul>

      <h2>Processors</h2>
      <ul>
        <li>Hosting: Hetzner Online GmbH (Germany).</li>
        <li>Payments: Stripe Payments Europe Ltd (Ireland).</li>
        <li>Transactional emails: Resend (United States, under EU standard contractual clauses).</li>
        <li>Sign-in (optional): Google and GitHub, only if you choose them.</li>
      </ul>

      <h2>Cookies</h2>
      <p>We only use the cookie needed to keep you signed in. No advertising or analytics cookies.</p>

      <h2>Your rights</h2>
      <p>
        You can access, correct, export or delete your data, object to some processing, and limit it. Write to{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. You can also complain to the CNIL (www.cnil.fr).
      </p>
    </LegalPage>
  );
}
