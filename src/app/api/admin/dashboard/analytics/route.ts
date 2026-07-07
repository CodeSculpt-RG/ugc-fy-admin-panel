import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { safeCount } from "@/lib/api/safe-count";
import { isMissingOptionalTableError } from "@/lib/api/safe-query";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AnalyticsPoint, AnalyticsHighLow } from "@/app/lib/types/analytics";
import { getDashboardMetrics } from "@/lib/api/metrics";
import { normalizeApprovalState, ApprovalStatusInput } from "@/app/services/adminUserStatus";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const days = range === "90d" ? 90 : range === "7d" ? 7 : 30;
  
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromDateStr = fromDate.toISOString();

  let partial = false;
  const missingTables: string[] = [];
  const emptySources: string[] = [];
  const missingColumns: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type SupabaseQueryBuilder = any;

  // Helper to fetch and aggregate timeseries data safely
  async function fetchTimeseries(
    tableName: string, 
    filterBuilder?: (q: SupabaseQueryBuilder) => SupabaseQueryBuilder,
    dateColumn = 'created_at',
    jsFilter?: (row: Record<string, unknown>) => boolean,
    selectColumns = dateColumn
  ): Promise<AnalyticsPoint[]> {
    let query = supabaseAdmin.from(tableName).select(selectColumns).gte(dateColumn, fromDateStr);
    if (filterBuilder) query = filterBuilder(query);

    const { data, error } = await query;

    if (error) {
      if (isMissingOptionalTableError(error)) {
        if (!missingTables.includes(tableName)) missingTables.push(tableName);
        partial = true;
        return [];
      }
      // If error is about missing column
      if (error.message?.includes("does not exist")) {
        missingColumns.push(`${tableName}.${dateColumn}`);
        partial = true;
        return [];
      }
      return [];
    }

    if (!data || data.length === 0) {
      if (!emptySources.includes(tableName)) emptySources.push(tableName);
      return [];
    }

    // Aggregate by day
    const aggregated: Record<string, number> = {};
    const rows = data as unknown as Record<string, unknown>[];
    
    rows.forEach((row) => {
      if (jsFilter && !jsFilter(row)) return;

      const val = row[dateColumn] as string | null | undefined;
      if (!val) return;
      const date = val.split("T")[0];
      aggregated[date] = (aggregated[date] || 0) + 1;
    });

    // Generate timeseries strictly from aggregated data
    const series: AnalyticsPoint[] = Object.keys(aggregated)
      .sort()
      .map((date) => ({
        date,
        value: aggregated[date],
      }));

    return series;
  }

  // Shared metrics
  const metrics = await getDashboardMetrics();

  // Users timeseries
  const usersSeries = await fetchTimeseries("profiles");
  
  // Creators timeseries
  const creatorsSeries = await fetchTimeseries(
    "profiles", 
    q => q.eq("role", "creator"), 
    "created_at",
    row => normalizeApprovalState(row as unknown as ApprovalStatusInput) === "approved",
    "id, role, approval_status, kyc_status, created_at"
  );

  // Brands timeseries
  const brandsSeries = await fetchTimeseries(
    "profiles", 
    q => q.eq("role", "brand"), 
    "created_at",
    row => normalizeApprovalState(row as unknown as ApprovalStatusInput) === "approved",
    "id, role, approval_status, kyc_status, created_at"
  );

  // Campaigns timeseries
  const campaignsSeries = await fetchTimeseries("campaigns");

  // Approvals timeseries
  const approvalsSeries = await fetchTimeseries(
    "profiles", 
    q => q.in("role", ["creator", "brand"]), 
    "created_at",
    row => normalizeApprovalState(row as unknown as ApprovalStatusInput) === "pending",
    "id, role, approval_status, kyc_status, created_at"
  );

  // Moderation timeseries
  const moderationSeries = await fetchTimeseries("moderation_cases");
  const moderationRes = await safeCount("moderation_cases");
  const moderationQueue = moderationRes.count;

  // Revenue - Explicitly mark missing until finance tables are ready
  missingTables.push("payments_or_transactions");
  partial = true;

  // Calculate Highs/Lows strictly from non-empty series
  function calcHighLow(series: AnalyticsPoint[]): { high: AnalyticsHighLow | null, low: AnalyticsHighLow | null } {
    if (!series || series.length === 0) return { high: null, low: null };
    
    let maxObj = series[0];
    let minObj = series[0];
    
    series.forEach(point => {
      if (point.value > maxObj.value) maxObj = point;
      if (point.value < minObj.value) minObj = point;
    });

    return {
      high: { date: maxObj.date, value: maxObj.value },
      low: { date: minObj.date, value: minObj.value }
    };
  }

  const usersHL = calcHighLow(usersSeries);
  const campaignsHL = calcHighLow(campaignsSeries);

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalUsers: metrics.totalUsers,
        totalCreators: metrics.approvedCreators,
        totalBrands: metrics.approvedBrands,
        activeCampaigns: metrics.activeCampaigns,
        pendingApprovals: metrics.pendingApprovals,
        totalRevenue: metrics.revenue.value || 0,
        revenueRestricted: metrics.revenue.restricted,
        monthlyRevenue: 0,
        moderationQueue,
      },
      timeseries: {
        users: usersSeries,
        creators: creatorsSeries,
        brands: brandsSeries,
        campaigns: campaignsSeries,
        revenue: [], // No fake data
        approvals: approvalsSeries,
        moderation: moderationSeries,
      },
      highsLows: {
        revenueHigh: null,
        revenueLow: null,
        usersHigh: usersHL.high,
        usersLow: usersHL.low,
        campaignsHigh: campaignsHL.high,
        campaignsLow: campaignsHL.low,
      },
      meta: {
        partial,
        missingTables,
        missingColumns,
        emptySources,
        generatedAt: new Date().toISOString(),
        rangeDays: days,
      },
    },
  });
}

