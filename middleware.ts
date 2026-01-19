
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if there's a JWT error in the URL
  const url = request.nextUrl.clone()
  
  // If the request is to the auth callback with an error
  if (url.pathname.startsWith('/api/auth') && url.searchParams.get('error')) {
    // Redirect to clear session page
    return NextResponse.redirect(new URL('/clear-session', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
