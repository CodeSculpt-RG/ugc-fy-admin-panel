import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCreators, getBrands } from "./approvedUsersService";

export type TimeseriesData = { date: string; value: number }[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTimeseries(tableName: string, dateColumn = 'created_at', filterBuilder?: (q: any) => any): Promise<TimeseriesData> {
  const days = 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  let query = supabaseAdmin.from(tableName).select(dateColumn).gte(dateColumn, fromDate.toISOString());
  if (filterBuilder) query = filterBuilder(query);

  const { data, error } = await query;
  if (error || !data) return [];

  const aggregated: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.forEach((row: any) => {
    const val = row[dateColumn];
    if (!val) return;
    const date = val.split("T")[0];
    aggregated[date] = (aggregated[date] || 0) + 1;
  });

  return Object.keys(aggregated).sort().map((date) => ({ date, value: aggregated[date] }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeCount(tableName: string, filterBuilder?: (q: any) => any): Promise<number> {
  let query = supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true });
  if (filterBuilder) query = filterBuilder(query);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

export async function getUserAnalytics() {
  const [totalUsers, totalCreators, totalBrands, timeseries, recentUsersRes] = await Promise.all([
    safeCount("profiles"),
    safeCount("creator_profiles"),
    safeCount("brand_profiles"),
    fetchTimeseries("profiles"),
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }).limit(10)
  ]);

  const recentUsers = recentUsersRes.data || [];

  return { totalUsers, totalCreators, totalBrands, timeseries, recentUsers };
}

export async function getCreatorAnalytics() {
  const approvedCreators = await getCreators();
  const totalCreators = approvedCreators.length;

  const [timeseries] = await Promise.all([
    fetchTimeseries("profiles", "created_at", (q: Record<string, unknown>) => (q.eq as (k: string, v: string) => unknown)("role", "creator"))
  ]);

  const recentCreators = approvedCreators.slice(0, 10);

  return { totalCreators, timeseries, recentCreators };
}

export async function getBrandAnalytics() {
  const approvedBrands = await getBrands();
  const totalBrands = approvedBrands.length;

  const [timeseries] = await Promise.all([
    fetchTimeseries("profiles", "created_at", (q: Record<string, unknown>) => (q.eq as (k: string, v: string) => unknown)("role", "brand"))
  ]);

  const recentBrands = approvedBrands.slice(0, 10);

  return { totalBrands, timeseries, recentBrands };
}

export async function getCampaignAnalytics() {
  const [activeCampaigns, draftCampaigns, timeseries, recentCampaignsRes] = await Promise.all([
    safeCount("campaigns", q => q.eq("status", "active")),
    safeCount("campaigns", q => q.eq("status", "draft")),
    fetchTimeseries("campaigns"),
    supabaseAdmin.from("campaigns").select("*").order("created_at", { ascending: false }).limit(10)
  ]);

  const recentCampaigns = recentCampaignsRes.data || [];
  const totalCampaigns = activeCampaigns + draftCampaigns + (await safeCount("campaigns", q => q.in("status", ["completed", "cancelled"])));

  return { totalCampaigns, activeCampaigns, draftCampaigns, timeseries, recentCampaigns };
}

export async function getApprovalAnalytics() {
  const [pendingApprovals, timeseries, recentPendingRes] = await Promise.all([
    safeCount("profiles", q => q.eq("status", "pending")),
    fetchTimeseries("profiles", "created_at", q => q.eq("status", "pending")),
    supabaseAdmin.from("profiles").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(10)
  ]);

  const recentPending = recentPendingRes.data || [];

  return { pendingApprovals, timeseries, recentPending };
}

export async function getRevenueAnalytics() {
  // Since we know payments_or_transactions might be missing, try catching the error safely
  try {
    const { count, error } = await supabaseAdmin.from("payments").select('*', { count: 'exact', head: true });
    if (error) {
      return { available: false, data: null };
    }
    return { available: true, data: { count } };
  } catch {
    return { available: false, data: null };
  }
}
