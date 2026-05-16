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

    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("role", "brand")
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;

    const brandIds = users?.map((p) => p.id) ?? [];
    let brandProfilesMap: Record<string, Record<string, unknown>> = {};

    if (brandIds.length > 0) {
      const { data: bProfiles, error: bProfilesError } = await supabaseAdmin
        .from("brand_profiles")
        .select("*")
        .in("user_id", brandIds);

      if (bProfilesError) throw bProfilesError;

      brandProfilesMap = (bProfiles ?? []).reduce((acc, curr) => {
        acc[curr.user_id] = curr;
        return acc;
      }, {} as Record<string, Record<string, unknown>>);
    }

    const data = users?.map((user) => {
      const bp = brandProfilesMap[user.id];
      return {
        ...user,
        full_name: user.name,
        approval_status: bp?.kyc_status === 'approved' ? 'approved' : bp?.kyc_status === 'rejected' ? 'rejected' : 'pending_review',
        brand_profile: bp ?? null,
      };
    }) ?? [];

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data,
      count: data.length,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/brands]", normalizedError);
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
