import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/admin', '/super-admin', '/instructor', '/trainee'];
const authPages = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('__session');

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthPage = authPages.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages.
  // Go directly to /admin/dashboard instead of '/' to avoid an
  // unnecessary client-side redirect hop through the root page.
  // The root page just checks auth and redirects to the dashboard
  // anyway, but this extra hop causes Edge to compile '/' and can
  // trigger a redirect loop when the cookie isn't yet visible.
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/super-admin/:path*',
    '/instructor/:path*',
    '/trainee/:path*',
    '/login',
    '/register',
  ],
};
