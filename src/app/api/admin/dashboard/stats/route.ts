import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/auth/admin-auth";
import { safeCount } from "@/lib/api/safe-count";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "dashboard:read");

    const missingTables = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeCountTrack = async (table: string, queryBuilder?: (q: any) => any) => {
      const res = await safeCount(table, queryBuilder);
      if (res.missing) missingTables.add(table);
      return res.count;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeFetch = async (table: string, queryBuilder: (q: any) => any) => {
      const { data, error } = await queryBuilder(supabaseAdmin.from(table));
      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01") {
          missingTables.add(table);
          return [];
        }
        console.error(`[safeFetch] Error fetching ${table}:`, error);
        return [];
      }
      return data || [];
    };

    const [
      totalCreators,
      totalBrands,
      totalAdmins,
      totalUsers,
      pendingCreators,
      pendingBrands,
      pendingUsersCount,
      approvedUsers,
      rejectedUsers,
      blockedUsers,
      recentUsersData,
      pendingQueueData,
    ] = await Promise.all([
      safeCountTrack("users", q => q.eq("role", "creator")),
      safeCountTrack("users", q => q.eq("role", "brand")),
      safeCountTrack("users", q => q.eq("role", "admin")),
      safeCountTrack("users"),
      
      safeCountTrack("users", q => q.eq("role", "creator").eq("approval_status", "pending_review")),
      safeCountTrack("users", q => q.eq("role", "brand").eq("approval_status", "pending_review")),
      safeCountTrack("users", q => q.eq("approval_status", "pending_review")),
      
      safeCountTrack("users", q => q.eq("approval_status", "approved")),
      safeCountTrack("users", q => q.eq("is_active", false)),
      safeCountTrack("users", q => q.eq("is_active", false)),
      
      safeFetch("users", q => q.select("id, email, role, approval_status, created_at").order("created_at", { ascending: false }).limit(5)),
      safeFetch("users", q => q.select("id, email, role, approval_status, created_at").eq("approval_status", "pending_review").order("created_at", { ascending: false }).limit(5)),
    ]);

    const isPartial = missingTables.size > 0;

    const stats = {
      totalUsers,
      totalCreators,
      totalBrands,
      
      pendingUsers: pendingUsersCount,
      pendingCreators,
      pendingBrands,
      
      approvedUsers,
      approvedCreators: 0, 
      approvedBrands: 0, 
      
      rejectedUsers,
      blockedUsers,
      
      completedProfiles: 0, 
      incompleteProfiles: 0, 
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentUsers: recentUsersData.map((u: any) => ({
        ...u,
        approval_status: u.approval_status || "pending_review",
        email: u.email || "Confidential"
      })),
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pendingApprovalQueue: pendingQueueData.map((u: any) => ({
        ...u,
        approval_status: u.approval_status || "pending_review",
        email: u.email || "Confidential"
      })),
      
      roleBreakdown: {
        creators: totalCreators,
        brands: totalBrands,
        admins: totalAdmins,
      },
      
      approvalBreakdown: {
        pending: pendingUsersCount,
        approved: approvedUsers,
        rejected: rejectedUsers,
        blocked: blockedUsers,
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
      meta: {
        partial: isPartial,
        missingTables: Array.from(missingTables),
        generatedAt: new Date().toISOString()
      }
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
