import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeApprovalState, ApprovalStatusInput } from "@/app/services/adminUserStatus";

import { PROFILE_SAFE_COLUMNS, CREATOR_PROFILE_SAFE_COLUMNS, BRAND_PROFILE_SAFE_COLUMNS } from "./supabaseSchemaSafe";

export type BaseProfileRow = {
  id: string;
  email: string | null;
  role: string;
  approval_status: string | null;
  kyc_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  kyc_approved_at: string | null;
  full_name: string | null;
};

export type CreatorProfile = BaseProfileRow & {
  creator_profile: Record<string, unknown> | null;
};

export type BrandProfile = BaseProfileRow & {
  brand_profile: Record<string, unknown> | null;
};

async function fetchBaseProfiles(role: "creator" | "brand", statusFilter: string = "approved"): Promise<BaseProfileRow[]> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_SAFE_COLUMNS)
    .eq("role", role)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`[approvedUsersService] Error fetching ${role}s:`, error);
    throw error;
  }

  const profiles = (data ?? []) as BaseProfileRow[];

  // Filter using normalizeApprovalState unless all is specified
  return profiles.filter((p) => {
    const state = normalizeApprovalState(p as unknown as ApprovalStatusInput);
    if (statusFilter === "all") return true;
    return state === statusFilter;
  });
}

export async function getCreators(statusFilter: string = "approved"): Promise<CreatorProfile[]> {
  const approvedProfiles = await fetchBaseProfiles("creator", statusFilter);
  if (approvedProfiles.length === 0) return [];

  const userIds = approvedProfiles.map((p) => p.id);

  let creatorProfiles: Record<string, unknown>[] = [];
  
  // Robust fetch for creator_profiles
  let { data, error } = await supabaseAdmin
    .from("creator_profiles")
    .select(CREATOR_PROFILE_SAFE_COLUMNS)
    .in("user_id", userIds);

  if (error && error.code === "42703") { // Missing column
    const fallback = await supabaseAdmin
      .from("creator_profiles")
      .select(CREATOR_PROFILE_SAFE_COLUMNS)
      .in("id", userIds);
    data = fallback.data;
    error = fallback.error;
  }

  if (!error && data) {
    creatorProfiles = data as Record<string, unknown>[];
  } else {
    console.warn("[approvedUsersService] Failed to fetch creator_profiles", error);
  }

  const cpMap = new Map<string, Record<string, unknown>>();
  creatorProfiles.forEach((cp) => {
    const key = (cp.user_id || cp.profile_id || cp.id) as string;
    if (key) cpMap.set(key, cp);
  });

  return approvedProfiles.map((p) => {
    const cp = cpMap.get(p.id) || null;
    return {
      ...p,
      creator_profile: cp,
    };
  });
}

export async function getBrands(statusFilter: string = "approved"): Promise<BrandProfile[]> {
  const approvedProfiles = await fetchBaseProfiles("brand", statusFilter);
  if (approvedProfiles.length === 0) return [];

  const userIds = approvedProfiles.map((p) => p.id);

  let brandProfiles: Record<string, unknown>[] = [];

  let { data, error } = await supabaseAdmin
    .from("brand_profiles")
    .select(BRAND_PROFILE_SAFE_COLUMNS)
    .in("profile_id", userIds);

  if (error && error.code === "42703") {
    const fallback1 = await supabaseAdmin
      .from("brand_profiles")
      .select(BRAND_PROFILE_SAFE_COLUMNS)
      .in("user_id", userIds);
    data = fallback1.data;
    error = fallback1.error;

    if (error && error.code === "42703") {
      const fallback2 = await supabaseAdmin
        .from("brand_profiles")
        .select(BRAND_PROFILE_SAFE_COLUMNS)
        .in("id", userIds);
      data = fallback2.data;
      error = fallback2.error;
    }
  }

  if (!error && data) {
    brandProfiles = data as Record<string, unknown>[];
  } else {
    console.warn("[approvedUsersService] Failed to fetch brand_profiles", error);
  }

  const bpMap = new Map<string, Record<string, unknown>>();
  brandProfiles.forEach((bp) => {
    const key = (bp.profile_id || bp.user_id || bp.id) as string;
    if (key) bpMap.set(key, bp);
  });

  return approvedProfiles.map((p) => {
    const bp = bpMap.get(p.id) || null;
    return {
      ...p,
      brand_profile: bp,
    };
  });
}

