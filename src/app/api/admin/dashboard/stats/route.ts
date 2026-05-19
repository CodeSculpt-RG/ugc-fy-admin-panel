import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "dashboard.read");
    if (!check.ok) return check.response;

    // Fetch counts and recent data in parallel for speed
    const [
      { count: totalCreators },
      { count: totalBrands },
      { count: totalAdmins },
      { count: totalUsers },
      
      { count: pendingCreators },
      { count: pendingBrands },
      { count: pendingUsersCount },
      
      { count: approvedUsers },
      { count: rejectedUsers },
      { count: blockedUsers },
      
      { data: recentUsersData },
      { data: pendingQueueData },
    ] = await Promise.all([
      // Basic counts
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "creator"),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "brand"),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "admin"),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      
      // Pending counts
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "creator").eq("is_verified", false),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "brand").eq("is_verified", false),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("is_verified", false),
      
      // Breakdown counts
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("is_verified", true),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("is_active", false),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("is_active", false),
      
      // Lists
      supabaseAdmin.from("users").select("id, email, role, is_verified, created_at").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("users").select("id, email, role, is_verified, created_at").eq("is_verified", false).order("created_at", { ascending: false }).limit(5),
    ]);

    const stats = {
      totalUsers: totalUsers ?? 0,
      totalCreators: totalCreators ?? 0,
      totalBrands: totalBrands ?? 0,
      
      pendingUsers: pendingUsersCount ?? 0,
      pendingCreators: pendingCreators ?? 0,
      pendingBrands: pendingBrands ?? 0,
      
      approvedUsers: approvedUsers ?? 0,
      approvedCreators: 0, // Simplified for now
      approvedBrands: 0, // Simplified for now
      
      rejectedUsers: rejectedUsers ?? 0,
      blockedUsers: blockedUsers ?? 0,
      
      completedProfiles: 0, // Simplified
      incompleteProfiles: 0, // Simplified
      
      recentUsers: (recentUsersData ?? []).map(u => ({
        ...u,
        approval_status: u.is_verified ? "approved" : "pending_review",
        email: u.email || "Confidential"
      })),
      
      pendingApprovalQueue: (pendingQueueData ?? []).map(u => ({
        ...u,
        approval_status: u.is_verified ? "approved" : "pending_review",
        email: u.email || "Confidential"
      })),
      
      roleBreakdown: {
        creators: totalCreators ?? 0,
        brands: totalBrands ?? 0,
        admins: totalAdmins ?? 0,
      },
      
      approvalBreakdown: {
        pending: pendingUsersCount ?? 0,
        approved: approvedUsers ?? 0,
        rejected: rejectedUsers ?? 0,
        blocked: blockedUsers ?? 0,
      },
      
      systemHealth: {
        supabaseConnected: true,
        apiStatus: "healthy" as const,
        lastSyncedAt: new Date().toISOString(),
      }
    };

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: stats,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/dashboard/stats]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
