import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

type BrandProfileRow = {
  id: string;
  user_id: string;
  company_name: string | null;
  brand_name: string | null;
  website_url: string | null;
  industry: string | null;
  phone: string | null;
  location: string | null;
  business_description: string | null;
  documents: unknown;
  created_at: string | null;
  updated_at: string | null;
};

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
      const { data, error } = await supabaseAdmin
        .from("brand_profiles")
        .select("*")
        .in("user_id", brandIds);

      if (error) throw error;

      brandProfiles = data ?? [];
    }

    const brandProfileMap = new Map(
      brandProfiles.map((brandProfile) => [
        brandProfile.user_id,
        brandProfile,
      ])
    );

    const brands =
      profiles?.map((profile) => ({
        ...profile,
        profile: brandProfileMap.get(profile.id) ?? null,
      })) ?? [];

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
