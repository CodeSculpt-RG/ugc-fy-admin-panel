import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/admin-auth";
import { normalizeError } from "@/lib/api/normalizeError";
import { normalizeApprovalState, ApprovalStatusInput } from "@/app/services/adminUserStatus";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "users:read"); // Using legacy 'users:read'

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") || "pending"; // all, pending, approved, rejected, blocked
    const roleParam = url.searchParams.get("role") || "all"; // all, creator, brand

    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, approval_status, kyc_status, profile_completed, created_at, updated_at")
      .order("created_at", { ascending: false });

    // Filter by role
    if (roleParam === "creator" || roleParam === "brand") {
      query = query.eq("role", roleParam);
    }

    const { data: profiles, error } = await query;

    if (error) throw error;

    let mappedUsers = profiles ?? [];

    // Filter by status using the normalizer
    if (statusParam && statusParam !== "all") {
      mappedUsers = mappedUsers.filter((user: Record<string, unknown>) => {
        return normalizeApprovalState(user as ApprovalStatusInput) === statusParam;
      });
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: mappedUsers,
      count: mappedUsers.length,
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
