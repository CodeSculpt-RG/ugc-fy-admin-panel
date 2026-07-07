import { NextRequest, NextResponse } from "next/server";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";
import { getCreators } from "@/app/services/approvedUsersService";

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, "creators.read");

    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const approvalStatus = searchParams.get("approval_status") || "approved";

    const creatorProfiles = await getCreators(approvalStatus);

    const creators = creatorProfiles.map((p) => {
      const creatorProfile = p.creator_profile;
      
      const resolvedName =
        (creatorProfile?.full_name as string) ||
        (creatorProfile?.username as string) ||
        p.full_name ||
        p.email ||
        "Unnamed Creator";
        
      const niches = creatorProfile?.niches as string[] | undefined;
      const nicheStr = niches && niches.length > 0 ? niches[0] : "General";
      const catStr = (creatorProfile?.category as string) || nicheStr;

      return {
        id: p.id,
        profile_id: creatorProfile?.profile_id || creatorProfile?.user_id || p.id,
        name: resolvedName,
        email: p.email || "No Email Registered",
        username: creatorProfile?.username || "creator_" + p.id.slice(0, 8),
        category: catStr,
        approval_status: p.approval_status || "pending_review",
        kyc_status: p.kyc_status || "not_started",
        created_at: p.created_at,
        updated_at: p.updated_at,
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

