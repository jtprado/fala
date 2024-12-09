import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
      
      // Get the redirect URL if it was set during sign in
      const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';
      
      // Redirect to the appropriate page
      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
    }

    // If no code is present, redirect to sign-in
    return NextResponse.redirect(new URL('/sign-in', requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    // If there's an error, redirect to sign-in
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
}
