import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Enforce HTTP Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Prevent Open Redirects: Sanitize redirect query parameters
  const redirectParam = request.nextUrl.searchParams.get('redirect');
  if (redirectParam) {
    // Only allow internal relative path redirects (starting with /) and prevent protocol-relative redirects (starting with //)
    if (!redirectParam.startsWith('/') || redirectParam.startsWith('//')) {
      const sanitizedUrl = request.nextUrl.clone();
      sanitizedUrl.searchParams.delete('redirect');
      return NextResponse.redirect(sanitizedUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files (_next/static, _next/image, favicon.ico, images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
