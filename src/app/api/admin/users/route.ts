import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";
import { safeQuery } from "@/lib/api/safe-query";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "brand" | "creator" | "admin" | string | null;
  approval_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type OptionalProfileRow = {
  id?: string | null;
  user_id?: string | null;
  profile_id?: string | null;
  company_name?: string | null;
  brand_name?: string | null;
  contact_name?: string | null;
  full_name?: string | null;
  username?: string | null;
  creator_name?: string | null;
  display_name?: string | null;
  kyc_status?: string | null;
};

type OptionalProfileLoad = {
  rows: OptionalProfileRow[];
  missingTable: string | null;
  warning: string | null;
};

function isMissingColumnError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "42703"
  ) {
    return true;
  }

  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";

  return message.includes("does not exist");
}

function getProfileKey(profile: OptionalProfileRow): string | null {
  return profile.profile_id || profile.user_id || profile.id || null;
}

async function loadOptionalProfiles(
  tableName: "brand_profiles" | "creator_profiles",
  profileIds: string[]
): Promise<OptionalProfileLoad> {
  if (profileIds.length === 0) {
    return { rows: [], missingTable: null, warning: null };
  }

  for (const columnName of ["profile_id", "user_id", "id"]) {
    const result = await safeQuery<OptionalProfileRow[]>(
      tableName,
      [],
      supabaseAdmin
        .from(tableName)
        .select("*")
        .in(columnName, profileIds)
    );

    if (result.ok && result.missing) {
      return { rows: [], missingTable: result.missingTable, warning: null };
    }

    if (result.ok) {
      return { rows: result.data, missingTable: null, warning: null };
    }

    if (!isMissingColumnError(result.error)) {
      return { rows: [], missingTable: null, warning: typeof result.error === 'string' ? result.error : 'Unknown error' };
    }
  }

  return {
    rows: [],
    missingTable: null,
    warning: `${tableName} exists but does not expose profile_id, user_id, or id for admin enrichment.`,
  };
}

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "users.read");
    if (!check.ok) return check.response;

    const { data: profiles, error, count } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, 
        email, 
        full_name, 
        role, 
        approval_status, 
        created_at, 
        updated_at
      `, { count: "exact" })
      .in('role', ['brand', 'creator'])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const typedProfiles = (profiles ?? []) as ProfileRow[];
    const brandIds = typedProfiles.filter((profile) => profile.role === "brand").map((profile) => profile.id);
    const creatorIds = typedProfiles.filter((profile) => profile.role === "creator").map((profile) => profile.id);
    const [brandProfilesResult, creatorProfilesResult] = await Promise.all([
      loadOptionalProfiles("brand_profiles", brandIds),
      loadOptionalProfiles("creator_profiles", creatorIds),
    ]);

    const brandProfileMap = new Map<string, OptionalProfileRow>();
    brandProfilesResult.rows.forEach((profile) => {
      const key = getProfileKey(profile);
      if (key) brandProfileMap.set(key, profile);
    });

    const creatorProfileMap = new Map<string, OptionalProfileRow>();
    creatorProfilesResult.rows.forEach((profile) => {
      const key = getProfileKey(profile);
      if (key) creatorProfileMap.set(key, profile);
    });

    const missingTables = [
      brandProfilesResult.missingTable,
      creatorProfilesResult.missingTable,
    ].filter((tableName): tableName is string => Boolean(tableName));

    const warnings = [
      brandProfilesResult.warning,
      creatorProfilesResult.warning,
    ].filter((warning): warning is string => Boolean(warning));

    const mappedUsers = typedProfiles.map(u => {
      const brandProfile = u.role === "brand" ? brandProfileMap.get(u.id) ?? null : null;
      const creatorProfile = u.role === "creator" ? creatorProfileMap.get(u.id) ?? null : null;

      return {
        id: u.id,
        platform_id: null,
        full_name: u.full_name,
        username: u.email ? u.email.split('@')[0] : null,
        email: u.email,
        role: u.role,
        approval_status: u.approval_status,
        is_visible_publicly: false,
        kyc_status: brandProfile?.kyc_status || creatorProfile?.kyc_status || null,
        created_at: u.created_at,
        updated_at: u.updated_at,
        
        // Pass these so getDisplayName in frontend doesn't break if it expects it
        brand_profiles: brandProfile,
        creator_profiles: creatorProfile
      };
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: mappedUsers,
      count: count ?? 0,
      meta: {
        partial: missingTables.length > 0 || warnings.length > 0,
        missingTables,
        warnings: process.env.NODE_ENV === "production" ? [] : warnings,
      },
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/users]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
