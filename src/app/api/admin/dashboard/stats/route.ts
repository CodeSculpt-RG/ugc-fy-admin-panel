import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/auth/admin-auth";
import { safeCount } from "@/lib/api/safe-count";
import { getDashboardMetrics } from "@/lib/api/metrics";
import { normalizeApprovalState, ApprovalStatusInput } from "@/app/services/adminUserStatus";

export const dynamic = 'force-dynamic';

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

    // Get core shared metrics
    const coreMetrics = await getDashboardMetrics();

    const [
      totalAdmins,
      allProfiles,
      recentUsersData,
    ] = await Promise.all([
      safeCountTrack("profiles", q => q.eq("role", "admin")),
      safeFetch("profiles", q => q.select("id, email, role, approval_status, kyc_status, created_at").in("role", ["creator", "brand"])),
      safeFetch("profiles", q => q.select("id, email, role, approval_status, kyc_status, created_at").order("created_at", { ascending: false }).limit(5)),
    ]);

    let pendingCreators = 0;
    let pendingBrands = 0;
    let approvedUsers = 0;
    let rejectedUsers = 0;
    let blockedUsers = 0;
    const pendingQueueData: Record<string, unknown>[] = [];

    allProfiles.forEach((p: Record<string, unknown>) => {
      const state = normalizeApprovalState(p as unknown as ApprovalStatusInput);
      
      if (state === "approved") {
        approvedUsers++;
      } else if (state === "rejected") {
        rejectedUsers++;
      } else if (state === "blocked") {
        blockedUsers++;
      } else if (state === "pending") {
        if (p.role === "creator") pendingCreators++;
        if (p.role === "brand") pendingBrands++;
        pendingQueueData.push(p);
      }
    });

    // Sort pendingQueueData by created_at desc and take top 5
    pendingQueueData.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at as string).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at as string).getTime() : 0;
      return db - da;
    });
    const recentPendingQueue = pendingQueueData.slice(0, 5);

    const isPartial = missingTables.size > 0;

    const stats = {
      totalUsers: coreMetrics.totalUsers,
      totalCreators: coreMetrics.approvedCreators,
      totalBrands: coreMetrics.approvedBrands,
      
      pendingUsers: pendingCreators + pendingBrands,
      pendingCreators,
      pendingBrands,
      
      approvedUsers,
      approvedCreators: coreMetrics.approvedCreators, 
      approvedBrands: coreMetrics.approvedBrands, 
      
      rejectedUsers,
      blockedUsers,
      
      completedProfiles: 0, 
      incompleteProfiles: 0, 
      
      recentUsers: recentUsersData.map((u: Record<string, unknown>) => ({
        ...u,
        approval_status: normalizeApprovalState(u as unknown as ApprovalStatusInput),
        email: u.email || "Confidential"
      })),
      
      pendingApprovalQueue: recentPendingQueue.map((u: Record<string, unknown>) => ({
        ...u,
        approval_status: "pending",
        email: u.email || "Confidential"
      })),
      
      roleBreakdown: {
        creators: coreMetrics.approvedCreators,
        brands: coreMetrics.approvedBrands,
        admins: totalAdmins,
      },
      
      approvalBreakdown: {
        pending: pendingCreators + pendingBrands,
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
    if (process.env.NODE_ENV === "development") {
      console.error("[GET /api/admin/dashboard/stats]", normalizedError);
    }
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}

