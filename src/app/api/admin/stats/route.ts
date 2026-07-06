import { NextResponse } from 'next/server';
import { handleApiError } from '@/app/lib/apiUtils';
import { safeCount } from '@/lib/api/safe-count';
import { requirePermission } from '@/lib/auth/admin-auth';

export async function GET(request: Request) {
  try {
    await requirePermission(request, "dashboard:read");
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
  }


  try {
    const missingTables = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeCountTrack = async (table: string, queryBuilder?: (q: any) => any) => {
      const res = await safeCount(table, queryBuilder);
      if (res.missing) missingTables.add(table);
      return res.count;
    };

    const [
      totalCreators,
      totalBrands,
      pendingCreators,
      approvedCreators,
      rejectedCreators,
      pendingBrands,
      approvedBrands,
      rejectedBrands,
      blockedUsers
    ] = await Promise.all([
      safeCountTrack('users', q => q.eq('role', 'creator')),
      safeCountTrack('users', q => q.eq('role', 'brand')),
      safeCountTrack('creator_profiles', q => q.in('kyc_status', ['pending', 'submitted'])),
      safeCountTrack('creator_profiles', q => q.eq('kyc_status', 'approved')),
      safeCountTrack('creator_profiles', q => q.eq('kyc_status', 'rejected')),
      safeCountTrack('brand_profiles', q => q.in('kyc_status', ['pending', 'submitted'])),
      safeCountTrack('brand_profiles', q => q.eq('kyc_status', 'approved')),
      safeCountTrack('brand_profiles', q => q.eq('kyc_status', 'rejected')),
      safeCountTrack('users', q => q.eq('is_active', false))
    ]);

    const isPartial = missingTables.size > 0;

    return NextResponse.json({
      success: true,
      data: {
        creators: totalCreators,
        brands: totalBrands,
        pending: pendingCreators + pendingBrands,
        approved: approvedCreators + approvedBrands,
        rejected: rejectedCreators + rejectedBrands,
        blocked: blockedUsers
      },
      meta: {
        partial: isPartial,
        missingTables: Array.from(missingTables),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
