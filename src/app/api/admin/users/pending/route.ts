import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/admin-auth";
import { normalizeError } from "@/lib/api/normalizeError";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "users:read");

    const { data: profiles, error, count } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, approval_status, profile_completed, created_at, updated_at, platform_id", { count: "exact" })
      .eq("approval_status", "pending_review")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedUsers = profiles ?? [];

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: mappedUsers,
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/users/pending]", normalizedError);
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
