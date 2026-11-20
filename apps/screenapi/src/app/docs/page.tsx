import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { CodeTabs } from '@/components/site/CodeTabs';
import { DEVICE_PRESETS } from '@/core/screenshot/domain/device-presets';
import { PLANS } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Screenshot API reference: authentication, parameters, formats, devices, errors and limits.',
};

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://screenapi.example';

const PARAMS: [string, string, string, string][] = [
  ['url', 'string', 'required', 'Page to capture, starting with http:// or https://.'],
  ['format', 'png · jpeg · webp · pdf', 'png', 'Output format. PDF pages are A4 with backgrounds.'],
  ['quality', '1–100', '—', 'Compression quality for jpeg and webp.'],
  ['full_page', 'boolean', 'false', 'Capture the whole scrollable page instead of the visible area.'],
  ['width / height', 'pixels', '1280 × 800', 'Viewport size (200–3840 × 200–2160).'],
  ['viewport', 'desktop · mobile · tablet', 'desktop', 'Quick size presets: 1280×800, 390×844, 820×1180.'],
  ['device', 'device id', '—', 'Emulate a real device (size, density, user agent). See the list below.'],
  ['retina', 'boolean', 'false', 'Render at 2× pixel density. Use scale for 1–3.'],
  ['dark_mode', 'boolean', 'false', 'Ask the page for its dark color scheme.'],
  ['element', 'CSS selector', '—', 'Capture only the first element matching this selector.'],
  ['wait_for_selector', 'CSS selector', '—', 'Wait until this element appears before capturing.'],
  ['delay', 'ms, 0–10000', '0', 'Extra wait after the page has loaded (animations, lazy content).'],
  ['timeout', 'ms, 1000–60000', '30000', 'Maximum time to load the page.'],
  ['hide', 'selectors, comma-separated', '—', 'Elements to hide before capturing (chat widgets, popups).'],
  ['block_cookies', 'boolean', 'true', 'Hide cookie consent banners.'],
  ['block_ads', 'boolean', 'false', 'Block common ad and tracking networks.'],
  ['user_agent', 'string', 'Chrome', 'Custom user agent.'],
  ['cache_ttl', 'seconds, 0–2592000', '0', 'Reuse an identical capture made within this time. Cache hits are free.'],
];

const ERRORS: [number, string, string][] = [
  [400, 'VALIDATION_ERROR', 'A parameter is missing or invalid. The details field lists which.'],
  [401, 'MISSING_API_KEY / INVALID_API_KEY', 'No key sent, or the key is unknown or revoked.'],
  [402, 'INSUFFICIENT_CREDITS', 'Monthly quota used up. It resets with your next billing month.'],
  [422, 'SELECTOR_NOT_FOUND', 'The element or wait_for_selector never appeared.'],
  [429, 'RATE_LIMIT_EXCEEDED', 'Too many requests this minute for your plan. See Retry-After.'],
  [502, 'NAVIGATION_FAILED / NETWORK_ERROR', 'The target site could not be reached.'],
  [503, 'BUSY', 'All capture slots are busy. Retry after a few seconds.'],
  [504, 'TIMEOUT', 'The page did not load within the timeout.'],
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="scroll-mt-20 border-t border-line pt-10 text-2xl font-semibold tracking-tight">{children}</h2>;
}

export default function DocsPage() {
  const devices = Object.entries(DEVICE_PRESETS);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-page gap-10 px-5 py-14 lg:grid-cols-[12rem_1fr]">
        <nav aria-label="On this page" className="hidden text-sm lg:block">
          <ul className="sticky top-6 space-y-2 text-muted">
            {[['start', 'Quick start'], ['auth', 'Authentication'], ['request', 'Request'], ['params', 'Parameters'], ['response', 'Response'], ['errors', 'Errors'], ['devices', 'Devices'], ['limits', 'Limits']].map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="hover:text-ink">{label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight">Documentation</h1>
          <p className="max-w-2xl text-lg text-muted">One endpoint turns a URL into an image or a PDF.</p>

          <H2 id="start">Quick start</H2>
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            <li><Link href="/auth/signup" className="text-ink underline decoration-accent underline-offset-4">Create a free account</Link> and copy your API key from the dashboard. It is shown only once.</li>
            <li>Call the API with the key and the page you want:</li>
          </ol>
          <CodeTabs />

          <H2 id="auth">Authentication</H2>
          <p className="max-w-3xl leading-relaxed text-muted">
            Send your key in the <code className="text-ink">x-api-key</code> header, or as <code className="text-ink">Authorization: Bearer YOUR_KEY</code>.
            For GET requests you can also pass <code className="text-ink">access_key=YOUR_KEY</code> in the URL. Only do this from your server:
            anyone who sees the URL can use your quota. Revoke a leaked key from the dashboard at any time.
          </p>

          <H2 id="request">Request</H2>
          <pre className="overflow-x-auto rounded-lg bg-surface p-4 text-sm"><code>{`POST ${BASE}/api/v1/screenshot
Content-Type: application/json
x-api-key: YOUR_KEY

{ "url": "https://example.com", "full_page": true, "format": "webp" }

GET ${BASE}/api/v1/screenshot?url=https://example.com&full_page=true&format=webp`}</code></pre>
          <p className="text-sm text-muted">Parameter names also work in camelCase (fullPage, darkMode…).</p>

          <H2 id="params">Parameters</H2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink text-left">
                  <th className="py-2 pr-4 font-semibold">Name</th>
                  <th className="py-2 pr-4 font-semibold">Values</th>
                  <th className="py-2 pr-4 font-semibold">Default</th>
                  <th className="py-2 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {PARAMS.map(([name, type, def, desc]) => (
                  <tr key={name} className="border-b border-line align-top">
                    <td className="py-2.5 pr-4"><code>{name}</code></td>
                    <td className="py-2.5 pr-4 text-muted">{type}</td>
                    <td className="py-2.5 pr-4 text-muted">{def}</td>
                    <td className="py-2.5 text-muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="response">Response</H2>
          <p className="max-w-3xl leading-relaxed text-muted">
            On success the body is the file itself (<code className="text-ink">image/png</code>, <code className="text-ink">image/jpeg</code>,
            <code className="text-ink"> image/webp</code> or <code className="text-ink">application/pdf</code>), with these headers:
          </p>
          <ul className="space-y-1 text-sm text-muted">
            <li><code className="text-ink">X-Credits-Remaining</code>: screenshots left this month</li>
            <li><code className="text-ink">X-Cache</code>: HIT when served from your cache (free), MISS otherwise</li>
            <li><code className="text-ink">X-Screenshot-Width</code>, <code className="text-ink">X-Screenshot-Height</code>: size of the capture</li>
            <li><code className="text-ink">X-Processing-Time-Ms</code>: total time spent</li>
          </ul>

          <H2 id="errors">Errors</H2>
          <p className="text-muted">Errors are JSON: <code className="text-ink">{'{"error": {"code": "…", "message": "…", "hint": "…"}}'}</code></p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <tbody>
                {ERRORS.map(([status, code, desc]) => (
                  <tr key={code} className="border-b border-line align-top">
                    <td className="py-2.5 pr-4 font-semibold">{status}</td>
                    <td className="py-2.5 pr-4"><code>{code}</code></td>
                    <td className="py-2.5 text-muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">Failed captures do not use credits.</p>

          <H2 id="devices">Devices</H2>
          <p className="text-muted">Pass the id as <code className="text-ink">device</code>. The list is also available at <code className="text-ink">GET /api/v1/devices</code>.</p>
          <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {devices.map(([id, d]) => (
              <p key={id} className="flex justify-between gap-3 border-b border-line py-1.5">
                <code>{id}</code>
                <span className="text-muted">{d.width}×{d.height}</span>
              </p>
            ))}
          </div>

          <H2 id="limits">Limits</H2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink text-left">
                  <th className="py-2 pr-4 font-semibold">Plan</th>
                  <th className="py-2 pr-4 font-semibold">Screenshots / month</th>
                  <th className="py-2 font-semibold">Requests / minute</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(PLANS).map((p) => (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-2.5 pr-4">{p.name}</td>
                    <td className="py-2.5 pr-4 text-muted">{p.screenshots.toLocaleString('en-US')}</td>
                    <td className="py-2.5 text-muted">{p.ratePerMinute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            Pages on private networks (localhost, internal IPs, cloud metadata) are refused. A capture takes 1 to 5 seconds for most pages;
            set a timeout in your HTTP client of at least 60 seconds.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
