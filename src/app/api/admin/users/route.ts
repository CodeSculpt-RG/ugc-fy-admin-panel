import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "users.read");
    if (!check.ok) return check.response;

    const { data: profiles, error, count } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, approval_status, profile_completed, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedUsers = (profiles ?? []).map(u => ({
      ...u,
      is_verified: u.approval_status === "approved"
    }));

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: mappedUsers,
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/users]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
