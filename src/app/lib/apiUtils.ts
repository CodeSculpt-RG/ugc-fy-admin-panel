import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabaseAdmin';

export async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { error: 'Missing authorization header', status: 401 };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Extract token from 'Bearer <token>'
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { error: 'Unauthorized: Invalid session', status: 401 };
  }

  if (user.email === 'admin@ugc-fy.in') {
    return { user, status: 200 };
  }

  // Check if user has admin role in users table using admin client to bypass RLS
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return { user, status: 200 };
}

export function handleApiError(error: unknown) {
  const err = error as Record<string, unknown> | null | undefined;
  const message = (err?.message as string) || (error instanceof Error ? error.message : String(error));
  
  return NextResponse.json({
    success: false,
    error: {
      message: message || "Internal Server Error",
      code: String(err?.code || "UNKNOWN_ERROR"),
      details: err?.details || null,
      hint: err?.hint || null,
    },
  }, { status: 500 });
}
