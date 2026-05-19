import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requirePermission(request, "creators.read");
    if (!check.ok) return check.response;

    const { id } = await params;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      throw profileError || new Error("Creator profile not found.");
    }

    const { data: cProfile, error: cProfileError } = await supabaseAdmin
      .from("creator_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (cProfileError && cProfileError.code !== "PGRST116") {
      throw cProfileError;
    }

    let mappedCProfile = cProfile ?? null;
    if (mappedCProfile) {
      const nicheStr = mappedCProfile.niches && mappedCProfile.niches.length > 0 ? mappedCProfile.niches[0] : "General";
      const locStr = mappedCProfile.primary_location || (mappedCProfile.city ? `${mappedCProfile.city}${mappedCProfile.state ? `, ${mappedCProfile.state}` : ""}` : "Unspecified");
      mappedCProfile = {
        ...mappedCProfile,
        creator_name: mappedCProfile.creator_name || mappedCProfile.full_name || mappedCProfile.username || null,
        phone: mappedCProfile.contact_phone || null,
        instagram_url: mappedCProfile.portfolio_urls && mappedCProfile.portfolio_urls.length > 0 ? mappedCProfile.portfolio_urls[0] : null,
        youtube_url: mappedCProfile.portfolio_urls && mappedCProfile.portfolio_urls.length > 1 ? mappedCProfile.portfolio_urls[1] : null,
        niche: nicheStr,
        location: locStr,
        portfolio_links: mappedCProfile.portfolio_urls || [],
        uploaded_videos: mappedCProfile.sample_video_urls || [],
      };
    }

    const data = {
      ...profile,
      full_name: profile.full_name || profile.email,
      creator_profile: mappedCProfile,
    };

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/creators/[id]]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
