import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { verifyAdmin, handleApiError } from '@/app/lib/apiUtils';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }


  try {
    const supabaseAdmin = getSupabaseAdmin();
    const [
      { count: totalCreators },
      { count: totalBrands },
      { count: pendingCreators },
      { count: approvedCreators },
      { count: rejectedCreators },
      { count: pendingBrands },
      { count: approvedBrands },
      { count: rejectedBrands },
      { count: blockedUsers }
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'brand'),
      supabaseAdmin.from('creator_profiles').select('*', { count: 'exact', head: true }).in('kyc_status', ['pending', 'submitted']),
      supabaseAdmin.from('creator_profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'approved'),
      supabaseAdmin.from('creator_profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'rejected'),
      supabaseAdmin.from('brand_profiles').select('*', { count: 'exact', head: true }).in('kyc_status', ['pending', 'submitted']),
      supabaseAdmin.from('brand_profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'approved'),
      supabaseAdmin.from('brand_profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'rejected'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', false)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        creators: totalCreators || 0,
        brands: totalBrands || 0,
        pending: (pendingCreators || 0) + (pendingBrands || 0),
        approved: (approvedCreators || 0) + (approvedBrands || 0),
        rejected: (rejectedCreators || 0) + (rejectedBrands || 0),
        blocked: blockedUsers || 0
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
