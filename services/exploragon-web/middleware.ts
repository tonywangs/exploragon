import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Generate a random nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Skip CSP in development for easier debugging
  if (process.env.NODE_ENV === 'development') {
    return response;
  }
  
  // More permissive CSP for pages that need Google Maps
  if (request.nextUrl.pathname.startsWith('/user') || request.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https://maps.googleapis.com https://maps.gstatic.com https://*.googlemaps.com https://*.googleapis.com https://polyfill.io`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com https://maps.gstatic.com data:",
        "img-src 'self' data: blob: https: https://maps.googleapis.com https://maps.gstatic.com https://*.googlemaps.com https://*.gstatic.com https://*.ggpht.com https://streetviewpixels-pa.googleapis.com https://geo0.ggpht.com https://geo1.ggpht.com https://geo2.ggpht.com https://geo3.ggpht.com",
        "connect-src 'self' https://maps.googleapis.com https://*.googlemaps.com https://*.googleapis.com https://*.gstatic.com wss: ws:",
        "frame-src 'self' https://maps.googleapis.com https://*.googlemaps.com",
        "worker-src 'self' blob:",
        "child-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
      ].join('; ')
    );
    
    // Store the nonce for use in the page
    response.headers.set('X-Nonce', nonce);
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};