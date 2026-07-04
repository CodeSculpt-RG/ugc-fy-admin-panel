import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/admin/force-password-change';

  if (!code) {
    return NextResponse.redirect(new URL('/admin/login?error=missing_auth_code', requestUrl.origin));
  }

  const { error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/admin/login?error=auth_callback_failed', requestUrl.origin));
  }

  let safeNext = '/admin/force-password-change';
  if (next.startsWith('/admin') && next !== '/admin/login') {
    safeNext = next;
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
