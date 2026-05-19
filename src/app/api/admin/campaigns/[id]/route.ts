import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requirePermission(request, "campaigns.read");
    if (!check.ok) return check.response;

    const { id } = await params;

    const { data: campaign, error } = await supabaseAdmin
      .from("campaigns")
      .select("*, brand:users!campaigns_brand_id_fkey(id, full_name, email)")
      .eq("id", id)
      .single();

    if (error || !campaign) {
      throw error || new Error("Campaign not found.");
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: campaign,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/campaigns/[id]]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
