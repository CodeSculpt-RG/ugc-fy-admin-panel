import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

type CreatorProfileRow = {
  id: string;
  user_id?: string;
  profile_id?: string;
  full_name?: string | null;
  username?: string | null;
  category?: string | null;
  niches?: string[] | null;
  contact_phone?: string | null;
  primary_location?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  portfolio_urls?: string[] | null;
  sample_video_urls?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function resolveCreatorDisplayName(creatorProfile: CreatorProfileRow | null, profile: any) {
  return (
    creatorProfile?.full_name ||
    creatorProfile?.username ||
    profile?.full_name ||
    profile?.name ||
    profile?.email ||
    "Unnamed Creator"
  );
}

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, "creators.read");

    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const approvalStatus = searchParams.get("approval_status");

    let profilesQuery = supabaseAdmin
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
      .eq("role", "creator")
      .order("created_at", { ascending: false });

    if (
      approvalStatus &&
      approvalStatus !== "all" &&
      ["pending_review", "approved", "rejected", "blocked"].includes(approvalStatus)
    ) {
      profilesQuery = profilesQuery.eq("approval_status", approvalStatus);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      throw profilesError;
    }

    const creatorIds = (profiles ?? []).map((profile) => profile.id);

    let creatorProfiles: CreatorProfileRow[] = [];

    if (creatorIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("creator_profiles")
        .select("*")
        .in("id", creatorIds);

      if (error) {
        throw error;
      }

      creatorProfiles = (data as unknown as CreatorProfileRow[]) ?? [];
    }

    const creatorProfileMap = new Map<string, CreatorProfileRow>(
      creatorProfiles.map((cp) => [
        cp.profile_id || cp.user_id || cp.id,
        cp,
      ])
    );

    const creators = (profiles ?? []).map((profile) => {
      const creatorProfile = creatorProfileMap.get(profile.id) ?? null;
      const resolvedName = resolveCreatorDisplayName(creatorProfile, profile);
      const nicheStr = creatorProfile?.niches && creatorProfile.niches.length > 0 ? creatorProfile.niches[0] : "General";
      const catStr = creatorProfile?.category || nicheStr;

      return {
        id: profile.id,
        profile_id: creatorProfile?.profile_id || creatorProfile?.user_id || profile.id,
        name: resolvedName,
        email: profile.email || "No Email Registered",
        platform_id: profile.platform_id || "",
        username: creatorProfile?.username || "creator_" + profile.id.slice(0, 8),
        category: catStr,
        approval_status: profile.approval_status || "pending_review",
        kyc_status: profile.kyc_status || "not_started",
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        creator_profile: creatorProfile ? {
          ...creatorProfile,
          creator_name: resolvedName,
          phone: creatorProfile.contact_phone || null,
          niche: nicheStr,
          location: creatorProfile.primary_location || (creatorProfile.city ? `${creatorProfile.city}${creatorProfile.state ? `, ${creatorProfile.state}` : ""}` : "Unspecified"),
          uploaded_videos: creatorProfile.sample_video_urls || [],
          portfolio_links: creatorProfile.portfolio_urls || [],
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: creators,
      count: creators.length,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);

    console.error("[GET /api/admin/creators]", normalizedError);

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
