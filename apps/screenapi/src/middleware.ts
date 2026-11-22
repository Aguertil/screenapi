export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/account/:path*', '/api/checkout/:path*'],
};
