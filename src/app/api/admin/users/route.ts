import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";
import { safeQuery } from "@/lib/api/safe-query";

type ProfileRow = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: "brand" | "creator" | "admin" | string | null;
  approval_status: string | null;
  profile_completed: boolean | null;
  kyc_status: string | null;
  is_verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  platform_id: string | null;
  is_visible_publicly: boolean | null;
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
};

type OptionalProfileLoad = {
  rows: OptionalProfileRow[];
  missingTable: string | null;
  warning: string | null;
};

function isMissingColumnError(error: string): boolean {
  return (
    error.includes("column") ||
    error.includes("Could not find") ||
    error.includes("42703")
  );
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
      return { rows: [], missingTable: null, warning: result.error };
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
        phone,
        full_name, 
        avatar_url, 
        role, 
        approval_status, 
        profile_completed,
        kyc_status,
        is_verified,
        created_at, 
        updated_at,
        platform_id,
        is_visible_publicly
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

      return {
        id: u.id,
        platform_id: u.platform_id,
        full_name: u.full_name,
        username: u.email ? u.email.split('@')[0] : null,
        email: u.email,
        role: u.role,
        approval_status: u.approval_status,
        is_visible_publicly: u.is_visible_publicly,
        kyc_status: u.kyc_status,
        created_at: u.created_at,
        updated_at: u.updated_at,
        
        // Pass these so getDisplayName in frontend doesn't break if it expects it
        brand_profiles: u.role === "brand" ? brandProfileMap.get(u.id) ?? null : null,
        creator_profiles: u.role === "creator" ? creatorProfileMap.get(u.id) ?? null : null
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
