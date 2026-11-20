'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function SiteHeader() {
  const { status } = useSession();
  const loggedIn = status === 'authenticated';
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span aria-hidden className="inline-block h-4 w-4 border-2 border-ink">
            <span className="block h-1.5 w-1.5 translate-x-[3px] translate-y-[3px] bg-accent" />
          </span>
          ScreenAPI
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <Link href="/docs" className="px-2 py-1 text-muted hover:text-ink">Docs</Link>
          <Link href="/pricing" className="px-2 py-1 text-muted hover:text-ink">Pricing</Link>
          {loggedIn ? (
            <Link href="/dashboard" className="rounded-md bg-ink px-3 py-1.5 font-medium text-white hover:bg-black">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="hidden px-2 py-1 text-muted hover:text-ink sm:inline">Sign in</Link>
              <Link href="/auth/signup" className="whitespace-nowrap rounded-md bg-ink px-3 py-1.5 font-medium text-white hover:bg-black">
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Get a free key</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
