import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export { isAdminEmail } from './adminEmails';
import { isAdminEmail } from './adminEmails';

/** Session admin, ou réponse 403 à renvoyer telle quelle. */
export async function requireAdmin(): Promise<{ email: string } | NextResponse> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { email };
}
