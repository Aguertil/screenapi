import { Suspense } from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { AuthForm } from '@/components/site/AuthForm';

export default function Page() {
  return (
    <>
      <SiteHeader />
      <Suspense>
        <AuthForm mode="signin" />
      </Suspense>
    </>
  );
}
