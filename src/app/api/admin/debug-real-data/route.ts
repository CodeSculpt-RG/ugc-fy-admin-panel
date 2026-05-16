import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { verifyAdmin } from "@/lib/api/verifyAdmin";

export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("users")
      .select("id, email, role, is_active, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (profilesError) throw profilesError;

    const { data: creators, error: creatorsError } = await supabaseAdmin
      .from("creator_profiles")
      .select("*")
      .limit(10);

    if (creatorsError) throw creatorsError;

    const { data: brands, error: brandsError } = await supabaseAdmin
      .from("brand_profiles")
      .select("*")
      .limit(10);

    if (brandsError) throw brandsError;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      message: "Direct database synchronization verified.",
      profiles: profiles ?? [],
      creator_profiles: creators ?? [],
      brand_profiles: brands ?? [],
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/debug-real-data]", normalizedError);
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
