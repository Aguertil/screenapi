import Link from 'next/link';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { TryIt } from '@/components/site/TryIt';
import { CodeTabs } from '@/components/site/CodeTabs';
import { PricingTable } from '@/components/site/PricingTable';
import { DEVICE_PRESETS } from '@/core/screenshot/domain/device-presets';

const FEATURES = [
  { title: 'Full page or viewport', text: 'Capture what fits on screen, or scroll the whole page into one tall image.' },
  { title: `${Object.keys(DEVICE_PRESETS).length} real devices`, text: 'iPhone, Galaxy, Pixel, iPad, MacBook… with the right size, pixel density and user agent.' },
  { title: 'PNG, JPEG, WebP, PDF', text: 'Images for previews and thumbnails, A4 PDFs for archiving and reports.' },
  { title: 'Clean captures', text: 'Cookie banners, chat bubbles, popups and ads removed, so the page looks like the page.' },
  { title: 'HTML to image', text: 'Send your own HTML and get back a social card, an invoice or an email preview.' },
  { title: 'Signed links for <img> tags', text: 'Put a capture straight into your site without exposing your API key.' },
  { title: 'Click, CSS and JavaScript', text: 'Close a modal, restyle a block or run a script before the capture is taken.' },
  { title: 'One element only', text: 'Pass a CSS selector to capture a chart, a pricing table or a single card.' },
  { title: 'Dark mode and Retina', text: 'Render in dark mode, at 2× or 3× pixel density, after a delay you choose.' },
  { title: 'Any place, any language', text: 'Set the location, time zone and language the page sees. Transparent backgrounds too.' },
  { title: 'Free cache hits', text: 'Ask for the same capture again within your cache time and it costs nothing.' },
  { title: 'Built to be safe', text: 'Private networks are blocked, keys are stored hashed, captures are never kept on our side.' },
];

const FAQ = [
  { q: 'What counts as a screenshot?', a: 'Each successful capture uses one credit, whatever its size or format. Failed captures and answers served from your cache are free.' },
  { q: 'What happens when I run out?', a: 'The API answers with a clear 402 error until your quota resets at the start of your next month, or until you move to a larger plan. You are never billed for overage.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard and your plan stays active until the end of the month you paid for, then you return to the free plan.' },
  { q: 'Do you keep my screenshots?', a: 'No. Images are sent back to you and not stored. Only usage metadata (URL, time, size) is kept for 90 days for your usage history and billing.' },
  { q: 'Do I get a VAT invoice?', a: 'Yes, every payment comes with an invoice. Add your company VAT number at checkout.' },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-page gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:pt-20">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Screenshots of any web page, from one API call.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Send a URL, get back a PNG, JPEG, WebP or PDF. Full page, mobile devices, dark mode, without cookie
              banners. 100 screenshots free every month, then from €9.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/signup" className="rounded-md bg-ink px-5 py-3 font-medium text-white hover:bg-black">
                Get a free API key
              </Link>
              <Link href="/docs" className="rounded-md border border-line px-5 py-3 font-medium hover:border-ink">
                Read the docs
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6 text-sm">
              <div><dt className="text-muted">Free plan</dt><dd className="mt-1 font-semibold">100 / month</dd></div>
              <div><dt className="text-muted">Paid plans</dt><dd className="mt-1 font-semibold">from €9</dd></div>
              <div><dt className="text-muted">Card needed</dt><dd className="mt-1 font-semibold">No</dd></div>
            </dl>
          </div>
          <div id="try">
            <TryIt />
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-page gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Works from any language</h2>
              <p className="mt-3 max-w-md leading-relaxed text-muted">
                It&apos;s one HTTP request. Send parameters as JSON with POST, or in the URL with GET to drop a capture straight
                into a server-side job. Your key goes in the <code className="text-ink">x-api-key</code> header.
              </p>
              <Link href="/docs" className="mt-5 inline-block font-medium underline decoration-accent decoration-2 underline-offset-4">
                All parameters
              </Link>
            </div>
            <CodeTabs />
          </div>
        </section>

        <section className="mx-auto max-w-page px-5 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">What you can capture</h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="border-t border-ink pt-4">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-page px-5 pb-20">
          <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
          <p className="mt-2 max-w-xl text-muted">Every option on every plan. You only choose how many screenshots you need.</p>
          <div className="mt-8"><PricingTable /></div>
        </section>

        <section className="mx-auto max-w-page px-5">
          <h2 className="text-2xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="mr-2 inline-block text-accent transition-transform group-open:rotate-45">+</span>
                  {item.q}
                </summary>
                <p className="mt-2 max-w-3xl pl-6 leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
