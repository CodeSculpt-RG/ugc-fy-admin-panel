import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { getSafeAdminRedirect } from '@/lib/auth/safe-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  // Safeguard: Validate redirect path
  const safeNext = getSafeAdminRedirect(next);

  if (!code) {
    return NextResponse.redirect(new URL('/admin/login?error=missing_auth_code', requestUrl.origin));
  }

  // Exchange code for a session
  const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[Auth Callback] Code exchange failed:", error);
    return NextResponse.redirect(new URL('/admin/login?error=auth_callback_failed', requestUrl.origin));
  }

  // Set response and write the admin-token cookie
  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  
  response.cookies.set("admin-token", data.session.access_token, {
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
