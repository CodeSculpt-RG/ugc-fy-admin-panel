import { safeCount } from "@/lib/api/safe-count";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeApprovalState, ApprovalStatusInput } from "@/app/services/adminUserStatus";

export type DashboardMetrics = {
  totalUsers: number;
  approvedCreators: number;
  approvedBrands: number;
  activeCampaigns: number;
  pendingApprovals: number;
  revenue: {
    value: number | null;
    restricted: boolean;
  };
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // 1. Total users
  const totalUsersRes = await safeCount("profiles");
  const totalUsers = totalUsersRes.count;

  // 2. Fetch minimal rows for Creators and Brands
  const { data: profileRows, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, approval_status, kyc_status");
  
  if (error) {
    console.error("[Dashboard Metrics Debug] Error fetching profiles:", error);
  }

  const rows = profileRows || [];

  // Filter creators
  const creatorRows = rows.filter((row: Record<string, unknown>) => row.role === "creator");
  const approvedCreators = creatorRows.filter((row: Record<string, unknown>) => normalizeApprovalState(row as ApprovalStatusInput) === "approved").length;

  // Filter brands
  const brandRows = rows.filter((row: Record<string, unknown>) => row.role === "brand");
  const approvedBrands = brandRows.filter((row: Record<string, unknown>) => normalizeApprovalState(row as ApprovalStatusInput) === "approved").length;

  // 4. Pending approvals: reviewable creators/brands that normalize to "pending"
  const pendingApprovals = rows.filter((row: Record<string, unknown>) => 
    (row.role === "creator" || row.role === "brand") && 
    normalizeApprovalState(row as ApprovalStatusInput) === "pending"
  ).length;

  try {
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_DEBUG_DASHBOARD === "true"
    ) {
      console.info("[Dashboard Metrics Debug]", {
        totalProfiles: totalUsers,
        creatorProfilesCount: creatorRows.length,
        brandProfilesCount: brandRows.length,
        approvedCreators,
        approvedBrands,
        pendingApprovals,
      });
    }
  } catch {
    // ignore
  }

  // 5. Active Campaigns
  const campaignsRes = await safeCount("campaigns", (q: Record<string, unknown>) => (q.eq as (k: string, v: string) => unknown)("status", "active"));
  const activeCampaigns = campaignsRes.count;

  return {
    totalUsers,
    approvedCreators,
    approvedBrands,
    activeCampaigns,
    pendingApprovals,
    revenue: {
      value: null,
      restricted: true,
    }
  };
}
