import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { COMPANY } from '@/lib/company';
import { PLANS } from '@/lib/plans';

export const metadata: Metadata = { title: 'Terms of service' };

export default function Terms() {
  const plans = Object.values(PLANS);
  return (
    <LegalPage title="Terms of service" updated="20 November 2026">
      <p>
        These terms govern the use of ScreenAPI, a service operated by {COMPANY.name} ({COMPANY.registration}, {COMPANY.address}),
        hereafter &quot;we&quot;. By creating an account you accept them.
      </p>

      <h2>1. The service</h2>
      <p>
        ScreenAPI renders web pages you designate and returns an image or a PDF through an HTTP API. You are responsible for the pages
        you request and for what you do with the results.
      </p>

      <h2>2. Account and API keys</h2>
      <p>
        You must give a valid email address and keep your password and API keys secret. Activity made with your keys is attributed to
        you. You can revoke a key at any time from your dashboard.
      </p>

      <h2>3. Plans, prices and payment</h2>
      <ul>
        {plans.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong>: {p.priceEur === 0 ? 'free' : `€${p.priceEur} excl. VAT per month`},{' '}
            {p.screenshots.toLocaleString('en-US')} screenshots per month, {p.ratePerMinute} requests per minute.
          </li>
        ))}
      </ul>
      <p>
        Paid plans are billed monthly in advance by card through Stripe. VAT is added where it applies. Each successful capture uses one
        credit; failed captures and cache hits are free. Unused credits do not carry over. When the quota is reached the API refuses
        further captures until the next monthly period: there are no overage fees.
      </p>
      <p>
        If a payment fails, Stripe retries it for a few days; without payment the subscription ends and the account returns to the free plan.
        We may change prices with at least 30 days&apos; notice by email; the change applies from your next billing period.
      </p>

      <h2>4. Changing plan and cancelling</h2>
      <p>
        You can upgrade, downgrade or cancel at any time from your dashboard. Upgrades apply immediately with a prorated charge.
        Cancellations take effect at the end of the paid month; the month already started is not refunded.
      </p>
      <p>
        Consumers in the European Union have a 14-day right of withdrawal. By starting to use a paid plan immediately, you ask us to
        begin the service before that period ends and accept that the right of withdrawal no longer applies to the part already used.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to use ScreenAPI to:</p>
      <ul>
        <li>break the law, infringe third-party rights (copyright, trademarks, privacy) or a website&apos;s terms of use;</li>
        <li>collect personal data unlawfully, or capture pages you have no right to access;</li>
        <li>attack, overload or probe websites or networks, or bypass access controls;</li>
        <li>produce or distribute illegal, deceptive (phishing, fake evidence) or harmful content;</li>
        <li>resell raw access to the API without our written agreement.</li>
      </ul>
      <p>We may suspend an account that breaches these rules, after notice when the situation allows it.</p>

      <h2>6. Availability</h2>
      <p>
        We do our best to keep the service available and fast, but we do not guarantee uninterrupted service. Maintenance may cause short
        interruptions. Some websites block automated browsers or render differently; we cannot guarantee that every page can be captured.
      </p>

      <h2>7. Liability</h2>
      <p>
        For business customers, our total liability for any claim related to the service is limited to the amounts you paid us in the
        12 months before the event. We are not liable for indirect losses such as lost profits or lost data. Nothing in these terms
        limits liability that cannot be limited by law.
      </p>

      <h2>8. Personal data</h2>
      <p>How we handle personal data is described in our <a href="/privacy">privacy policy</a>.</p>

      <h2>9. Changes and termination</h2>
      <p>
        We may update these terms and will tell you by email at least 30 days before material changes. You can close your account at any
        time from your account page.
      </p>

      <h2>10. Law and disputes</h2>
      <p>
        These terms are governed by French law. Before any legal action, please contact us at{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> to find a solution. Consumers may also use the EU online dispute platform
        or a consumer mediator. For business customers, the courts with jurisdiction over our registered office have exclusive jurisdiction.
      </p>
    </LegalPage>
  );
}
