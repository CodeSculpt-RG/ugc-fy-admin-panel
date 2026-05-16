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

    // Two-step fetch to avoid potential relationship mapping issues in prototype stage
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("role", "creator")
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;

    const creatorIds = users?.map((p) => p.id) ?? [];
    let creatorProfilesMap: Record<string, Record<string, unknown>> = {};

    if (creatorIds.length > 0) {
      const { data: cProfiles, error: cProfilesError } = await supabaseAdmin
        .from("creator_profiles")
        .select("*")
        .in("user_id", creatorIds);

      if (cProfilesError) throw cProfilesError;

      creatorProfilesMap = (cProfiles ?? []).reduce((acc, curr) => {
        acc[curr.user_id] = curr;
        return acc;
      }, {} as Record<string, Record<string, unknown>>);
    }

    const data = users?.map((user) => {
      const cp = creatorProfilesMap[user.id];
      // Map live database fields to expected internal fields
      return {
        ...user,
        full_name: user.name,
        approval_status: cp?.kyc_status === 'approved' ? 'approved' : cp?.kyc_status === 'rejected' ? 'rejected' : 'pending_review',
        creator_profile: cp ?? null,
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
