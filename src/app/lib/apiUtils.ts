/**
 * @deprecated verifyAdmin — Secure re-export from canonical implementation.
 *
 * The previous implementation in this file contained a hardcoded email bypass
 * (admin@ugc-fy.in) and a `users` table role check that bypassed the full
 * admin_profiles permission system. Both have been removed.
 *
 * All routes importing verifyAdmin from this file now use the secure
 * lib/api/verifyAdmin.ts logic which enforces:
 *   1. Supabase JWT validation
 *   2. admin_profiles record lookup
 *   3. admin_role_permissions hydration
 *   4. must_change_password enforcement
 */
export { verifyAdmin } from '@/lib/api/verifyAdmin';

import { NextResponse } from 'next/server';

export function handleApiError(error: unknown) {
  const err = error as Record<string, unknown> | null | undefined;
  const message = (err?.message as string) || (error instanceof Error ? error.message : String(error));

  return NextResponse.json({
    success: false,
    error: {
      message: message || 'Internal Server Error',
      code: String(err?.code || 'UNKNOWN_ERROR'),
      details: err?.details || null,
      hint: err?.hint || null,
    },
  }, { status: 500 });
}

