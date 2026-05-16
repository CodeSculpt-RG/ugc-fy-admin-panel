import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { verifyAdmin } from "@/lib/api/verifyAdmin";

async function getCount(table: string) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) throw error;

  return count ?? 0;
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const profilesCount = await getCount("users");
    const creatorProfilesCount = await getCount("creator_profiles");
    const brandProfilesCount = await getCount("brand_profiles");

    const { count: pendingUsersCount, error: pendingError } = await supabaseAdmin
      .from("creator_profiles")
      .select("*", { count: "exact", head: true })
      .eq("kyc_status", "pending");

    if (pendingError) throw pendingError;

    const { data: latestProfiles, error: latestError } = await supabaseAdmin
      .from("users")
      .select("id, email, role, is_active, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (latestError) throw latestError;

    return NextResponse.json({
      success: true,
      supabaseConnected: true,
      source: "real_supabase_database",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      profilesCount,
      creatorsCount: creatorProfilesCount,
      brandsCount: brandProfilesCount,
      pendingUsersCount: pendingUsersCount ?? 0,
      latestProfiles: latestProfiles ?? [],
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/health]", normalizedError);
    return NextResponse.json(
      {
        success: false,
        supabaseConnected: false,
        source: "real_supabase_database",
        error: normalizedError,
      },
      { status: 500 }
    );
  }
}
