import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    // Create a response to modify
    const res = NextResponse.next();
    
    // Create supabase middleware client
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Get user - this will verify the session
    const { data: { user }, error } = await supabase.auth.getUser();

    // Check if the user is authenticated
    const isAuth = !!user && !error;
    const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in');

    // Handle authentication routing
    if (isAuthPage) {
      if (isAuth) {
        // If user is authenticated and tries to access auth page,
        // redirect to home page
        return NextResponse.redirect(new URL('/', request.url));
      }
      // Allow access to auth page if not authenticated
      return res;
    }

    // Special handling for auth callback and API routes
    if (
      request.nextUrl.pathname.startsWith('/auth/callback') ||
      request.nextUrl.pathname.startsWith('/api/')
    ) {
      return res;
    }

    // Protect all other routes
    if (!isAuth) {
      // Store the original URL as a redirect URL
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('redirectUrl', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (e) {
    // If there's an error, redirect to sign-in page
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
}

// Specify which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (auth callback route)
     * - api routes (API endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth/callback|api/).*)',
  ],
};
