import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { SiteHeader } from '@/components/site/SiteHeader';
import { AdminDashboard } from './AdminDashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/auth/signin?callbackUrl=/admin');
  if (!isAdminEmail(session.user.email)) redirect('/dashboard');
  return (
    <>
      <SiteHeader />
      <AdminDashboard adminEmail={session.user.email} />
    </>
  );
}
