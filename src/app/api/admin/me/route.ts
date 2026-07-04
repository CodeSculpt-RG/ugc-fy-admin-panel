import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/api/verifyAdmin';

export async function GET(request: Request) {
  try {
    const result = await verifyAdmin(request);

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          code: result.error.code,
          message: result.error.message,
        },
        {
          status: result.status === 401 ? 401 : 403,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        admin: result.admin,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/admin/me] unexpected error:', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        message: 'Unexpected admin session error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
