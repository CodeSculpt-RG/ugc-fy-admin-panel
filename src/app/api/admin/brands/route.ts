import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

type BrandProfileRow = {
  id: string;
  user_id?: string;
  profile_id?: string;
  company_name: string | null;
  brand_name: string | null;
  contact_name: string | null;
  industry: string | null;
  website_url?: string | null;
  location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function resolveBrandDisplayName(
  brandProfile: BrandProfileRow | null,
  profile: { full_name?: string | null; name?: string | null; email?: string | null } | null
) {
  return (
    brandProfile?.company_name ||
    brandProfile?.brand_name ||
    brandProfile?.contact_name ||
    profile?.full_name ||
    profile?.name ||
    profile?.email ||
    "Unnamed Brand"
  );
}

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, "brands.read");

    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("approval_status");

    let query = supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        role,
        full_name,
        avatar_url,
        approval_status,
        kyc_status,
        platform_id,
        profile_completed,
        rejection_reason,
        approved_at,
        approved_by,
        created_at,
        updated_at
      `)
      .eq("role", "brand")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("approval_status", statusFilter);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) throw profilesError;

    const brandIds = profiles?.map((profile) => profile.id) ?? [];

    let brandProfiles: BrandProfileRow[] = [];

    if (brandIds.length > 0) {
      let { data, error } = await supabaseAdmin
        .from("brand_profiles")
        .select("*")
        .in("profile_id", brandIds);

      if (error && error.code === '42703') {
        const fallback1 = await supabaseAdmin
          .from("brand_profiles")
          .select("*")
          .in("user_id", brandIds);
        data = fallback1.data as BrandProfileRow[] | null;
        error = fallback1.error;

        if (error && error.code === '42703') {
          const fallback2 = await supabaseAdmin
            .from("brand_profiles")
            .select("*")
            .in("id", brandIds);
          data = fallback2.data as BrandProfileRow[] | null;
          error = fallback2.error;
        }
      }

      if (error) {
        console.warn("[admin/brands] failed to fetch brand_profiles, continuing without them:", error);
      }

      brandProfiles = (data as BrandProfileRow[]) ?? [];
    }

    const brandProfileMap = new Map<string, BrandProfileRow>(
      brandProfiles.map((brandProfile) => [
        brandProfile.profile_id || brandProfile.user_id || brandProfile.id,
        brandProfile,
      ])
    );

    const brands = (profiles ?? []).map((profile) => {
      const brandProfile = brandProfileMap.get(profile.id) ?? null;
      const resolvedName = resolveBrandDisplayName(brandProfile, profile);

      return {
        id: profile.id,
        profile_id: brandProfile?.profile_id || brandProfile?.user_id || profile.id,
        name: resolvedName,
        email: profile.email || "No Email Registered",
        platform_id: profile.platform_id || "",
        company_name: brandProfile?.company_name || "Unregistered Corp",
        industry: brandProfile?.industry || "Commercial",
        active_campaigns: 0,
        aggregate_gmv: 0,
        approval_status: profile.approval_status || "pending_review",
        kyc_status: profile.kyc_status || "not_started",
        created_at: profile.created_at,
        updated_at: profile.updated_at,
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
