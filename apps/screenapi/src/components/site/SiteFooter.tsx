import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-page gap-8 px-5 py-10 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="font-semibold text-ink">ScreenAPI</p>
          <p className="mt-2 max-w-xs">Website screenshots and PDFs through a simple API. Operated by MB Auto SASU, France.</p>
        </div>
        <ul className="space-y-2">
          <li><Link href="/docs" className="hover:text-ink">Documentation</Link></li>
          <li><Link href="/pricing" className="hover:text-ink">Pricing</Link></li>
          <li><Link href="/auth/signup" className="hover:text-ink">Create an account</Link></li>
        </ul>
        <ul className="space-y-2">
          <li><Link href="/terms" className="hover:text-ink">Terms of service</Link></li>
          <li><Link href="/privacy" className="hover:text-ink">Privacy policy</Link></li>
          <li><Link href="/legal" className="hover:text-ink">Legal notice</Link></li>
        </ul>
      </div>
    </footer>
  );
}
