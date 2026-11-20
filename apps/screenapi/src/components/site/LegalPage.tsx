import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-page px-5 py-14">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
        <div className="prose-legal mt-8">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
