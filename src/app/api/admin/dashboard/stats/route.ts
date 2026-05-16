import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { verifyAdmin } from "@/lib/api/verifyAdmin";

export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

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
      source: "real_supabase_database",
      data: {
        creators: totalCreators || 0,
        brands: totalBrands || 0,
        pending: (pendingCreators || 0) + (pendingBrands || 0),
        approved: (approvedCreators || 0) + (approvedBrands || 0),
        rejected: (rejectedCreators || 0) + (rejectedBrands || 0),
        blocked: blockedUsers || 0
      }
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/dashboard/stats]", normalizedError);
    return NextResponse.json(
      {
        success: false,
        source: "real_supabase_database",
        error: normalizedError,
      },
      { status: 500 }
    );
  }
}
