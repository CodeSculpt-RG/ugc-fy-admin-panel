import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requirePermission(request, "brands.read");
    if (!check.ok) return check.response;

    const { id } = await params;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profileError || !profile) {
      throw profileError || new Error("Brand profile not found.");
    }

    let bProfile = null;
    let bProfileError = null;

    const resProfileId = await supabaseAdmin
      .from("brand_profiles")
      .select("*")
      .eq("profile_id", id)
      .maybeSingle();

    if (resProfileId.error && resProfileId.error.code === '42703') {
      const resUserId = await supabaseAdmin
        .from("brand_profiles")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();
      
      if (resUserId.error && resUserId.error.code === '42703') {
        const resId = await supabaseAdmin
          .from("brand_profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        bProfile = resId.data;
        bProfileError = resId.error;
      } else {
        bProfile = resUserId.data;
        bProfileError = resUserId.error;
      }
    } else {
      bProfile = resProfileId.data;
      bProfileError = resProfileId.error;
    }

    if (bProfileError && bProfileError.code !== "PGRST116") {
      throw bProfileError;
    }

    const data = {
      ...profile,
      full_name: profile.full_name || profile.name || profile.email || "Unnamed Brand",
      brand_profile: bProfile ?? null,
    };

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/brands/[id]]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
