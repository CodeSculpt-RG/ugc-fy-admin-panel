import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "campaigns.read");
    if (!check.ok) return check.response;

    const { data: campaigns, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const profileIds = Array.from(
      new Set(
        (campaigns ?? [])
          .flatMap((c) => [c.brand_id, c.creator_id])
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    let profilesData: Array<{ id: string; full_name: string | null; email: string | null; role: string | null; avatar_url: string | null }> = [];
    if (profileIds.length > 0) {
      const { data, error: profsErr } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, role, avatar_url")
        .in("id", profileIds);
      if (profsErr) throw profsErr;
      if (data) profilesData = data;
    }

    const profileMap = new Map(profilesData.map((p) => [p.id, p]));

    const enrichedCampaigns = (campaigns ?? []).map((c) => {
      const brandProfile = typeof c.brand_id === "string" ? profileMap.get(c.brand_id) ?? null : null;
      const creatorProfile = typeof c.creator_id === "string" ? profileMap.get(c.creator_id) ?? null : null;

      const brandName = brandProfile?.full_name || brandProfile?.email || "Unknown Brand";
      const budgetNum = Number(c.budget || 0);

      const statusStr = String(c.status || "Draft");
      const normalizedStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();
      const validStatuses = ["Draft", "Pending", "Active", "Paused", "Completed", "Rejected", "Disputed"];
      const finalStatus = validStatuses.includes(normalizedStatus) ? normalizedStatus : "Draft";

      return {
        id: String(c.id || "unknown"),
        title: String(c.title || "Untitled Initiative"),
        brand: brandName,
        budget: `$${budgetNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        creators: Number(c.creators_needed || 1),
        submissions: Number(c.submissions_count || 0),
        deadline: c.deadline ? new Date(c.deadline).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "No deadline",
        status: finalStatus,
        date: c.created_at ? new Date(c.created_at).toLocaleDateString() : undefined,
        brand_profile: brandProfile,
        creator_profile: creatorProfile,
      };
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: enrichedCampaigns,
      count: enrichedCampaigns.length,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/campaigns]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
