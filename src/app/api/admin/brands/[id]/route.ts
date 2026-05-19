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
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      throw profileError || new Error("Brand profile not found.");
    }

    const { data: bProfile, error: bProfileError } = await supabaseAdmin
      .from("brand_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (bProfileError && bProfileError.code !== "PGRST116") {
      throw bProfileError;
    }

    const data = {
      ...profile,
      full_name: profile.name || profile.email,
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
