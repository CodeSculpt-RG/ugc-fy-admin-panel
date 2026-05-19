import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

type CreatorProfileRow = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  contact_phone?: string | null;
  city?: string | null;
  state?: string | null;
  primary_location?: string | null;
  bio?: string | null;
  niches?: string[] | null;
  portfolio_urls?: string[] | null;
  sample_video_urls?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

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
        .select(`
          id,
          full_name,
          username,
          contact_phone,
          city,
          state,
          primary_location,
          bio,
          niches,
          portfolio_urls,
          sample_video_urls,
          created_at,
          updated_at
        `)
        .in("id", creatorIds);

      if (error) {
        throw error;
      }

      creatorProfiles = data ?? [];
    }

    const creatorProfileMap = new Map(
      creatorProfiles.map((cp) => {
        const nicheStr = cp.niches && cp.niches.length > 0 ? cp.niches[0] : "General";
        const locStr = cp.primary_location || (cp.city ? `${cp.city}${cp.state ? `, ${cp.state}` : ""}` : "Unspecified");
        return [
          cp.id,
          {
            id: cp.id,
            creator_name: cp.full_name || cp.username || null,
            phone: cp.contact_phone || null,
            instagram_url: cp.portfolio_urls && cp.portfolio_urls.length > 0 ? cp.portfolio_urls[0] : null,
            youtube_url: cp.portfolio_urls && cp.portfolio_urls.length > 1 ? cp.portfolio_urls[1] : null,
            niche: nicheStr,
            location: locStr,
            bio: cp.bio || null,
            portfolio_links: cp.portfolio_urls || [],
            uploaded_videos: cp.sample_video_urls || [],
            created_at: cp.created_at || null,
            updated_at: cp.updated_at || null,
          },
        ];
      })
    );

    const creators = (profiles ?? []).map((profile) => ({
      ...profile,
      creator_profile: creatorProfileMap.get(profile.id) ?? null,
    }));

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
