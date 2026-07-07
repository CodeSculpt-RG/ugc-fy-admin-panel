import { NextRequest, NextResponse } from "next/server";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";
import { getBrands } from "@/app/services/approvedUsersService";

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, "brands.read");

    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const approvalStatus = searchParams.get("approval_status") || "approved";

    const brandProfiles = await getBrands(approvalStatus);

    const brands = brandProfiles.map((p) => {
      const brandProfile = p.brand_profile;

      const resolvedName =
        (brandProfile?.company_name as string) ||
        (brandProfile?.brand_name as string) ||
        (brandProfile?.contact_name as string) ||
        p.full_name ||
        p.email ||
        "Unnamed Brand";

      return {
        id: p.id,
        profile_id: brandProfile?.profile_id || brandProfile?.user_id || p.id,
        name: resolvedName,
        email: p.email || "No Email Registered",
        company_name: (brandProfile?.company_name as string) || "Unregistered Corp",
        industry: (brandProfile?.industry as string) || "Commercial",
        active_campaigns: 0,
        aggregate_gmv: 0,
        approval_status: p.approval_status || "pending_review",
        kyc_status: p.kyc_status || "not_started",
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: brands,
      count: brands.length,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);

    console.error("[GET /api/admin/brands]", normalizedError);

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

