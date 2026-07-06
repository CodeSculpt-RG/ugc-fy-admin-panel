import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { safeCount } from "@/lib/api/safe-count";
import { safeQuery } from "@/lib/api/safe-query";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AnalyticsPoint = {
  date: string;
  value: number;
};

export type AnalyticsHighLow = {
  date: string;
  value: number;
};

function generateEmptyTimeseries(days: number): AnalyticsPoint[] {
  const series: AnalyticsPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    series.push({ date: d.toISOString().split("T")[0], value: 0 });
  }
  return series;
}

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

  const emptySeries = generateEmptyTimeseries(days);

  // Users
  const usersRes = await safeCount("profiles");
  const totalUsers = usersRes.count;
  if (usersRes.missing) { partial = true; missingTables.push("profiles"); }

  // Creators
  const creatorsRes = await safeCount("profiles", q => q.eq("role", "creator"));
  const totalCreators = creatorsRes.count;
  if (creatorsRes.missing && !missingTables.includes("profiles")) { partial = true; missingTables.push("profiles"); }

  // Brands
  const brandsRes = await safeCount("profiles", q => q.eq("role", "brand"));
  const totalBrands = brandsRes.count;
  if (brandsRes.missing && !missingTables.includes("profiles")) { partial = true; missingTables.push("profiles"); }

  // Campaigns
  const campaignsRes = await safeCount("campaigns");
  const activeCampaigns = campaignsRes.count;
  if (campaignsRes.missing) { partial = true; missingTables.push("campaigns"); }

  // Approvals
  const approvalsRes = await safeCount("profiles", q => q.eq("status", "pending"));
  const pendingApprovals = approvalsRes.count;

  // Moderation
  const moderationRes = await safeCount("moderation_cases");
  const moderationQueue = moderationRes.count;
  if (moderationRes.missing) { partial = true; missingTables.push("moderation_cases"); }

  // Revenue
  // Safe check if payments table exists by counting it
  const paymentsCheck = await safeCount("payments");
  const totalRevenue = 0;
  const monthlyRevenue = 0;
  if (paymentsCheck.missing) {
    partial = true;
    missingTables.push("payments/transactions");
  } else {
    // If table exists, we would query the sum. For now, if count is 0, we can say 0.
    // Assuming a safe fallback for revenue
  }

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalUsers,
        totalCreators,
        totalBrands,
        activeCampaigns,
        pendingApprovals,
        totalRevenue,
        monthlyRevenue,
        moderationQueue,
      },
      timeseries: {
        users: emptySeries,
        creators: emptySeries,
        brands: emptySeries,
        campaigns: emptySeries,
        revenue: emptySeries,
        approvals: emptySeries,
        moderation: emptySeries,
      },
      highsLows: {
        revenueHigh: null,
        revenueLow: null,
        usersHigh: null,
        usersLow: null,
        campaignsHigh: null,
        campaignsLow: null,
      },
      meta: {
        partial,
        missingTables,
        generatedAt: new Date().toISOString(),
        rangeDays: days,
      },
    },
  });
}
