import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { normalizeError } from "@/lib/api/normalizeError";

type PaymentStatus = "pending" | "released" | "failed" | "refunded";

const PAID_STATUS: PaymentStatus = "released";



export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Fetch real profiles
    const { data: profiles, error: pError } = await supabaseAdmin
      .from("profiles")
      .select("role, created_at");
    if (pError) throw pError;

    // Fetch real payments
    const { data: payments, error: payError } = await supabaseAdmin
      .from("payments")
      .select("amount, created_at, status")
      .eq("status", PAID_STATUS);
    if (payError) throw payError;

    // Fetch real brand profiles for sectors
    const { data: brands, error: bError } = await supabaseAdmin
      .from("brand_profiles")
      .select("industry");
    if (bError) throw bError;

    // 1. Process Monthly Growth (last 6 months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    
    const growthMap: Record<string, { creators: number; brands: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const mIndex = (currentMonthIndex - i + 12) % 12;
      growthMap[months[mIndex]] = { creators: 0, brands: 0 };
    }

    (profiles ?? []).forEach((p) => {
      if (!p.created_at) return;
      const d = new Date(p.created_at);
      const mName = months[d.getMonth()];
      if (growthMap[mName]) {
        if (p.role === "creator") growthMap[mName].creators += 1;
        else if (p.role === "brand") growthMap[mName].brands += 1;
      }
    });

    const userGrowthData = Object.keys(growthMap).map((m) => ({
      name: m,
      creators: growthMap[m].creators,
      brands: growthMap[m].brands,
    }));

    // 2. Revenue (Weekly)
    const revenueMap: Record<string, number> = { "W1": 0, "W2": 0, "W3": 0, "W4": 0 };
    (payments ?? []).forEach((p) => {
      if (!p.created_at || !p.amount) return;
      const d = new Date(p.created_at);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const weekNum = Math.min(Math.floor(diffDays / 7) + 1, 4);
      revenueMap[`W${weekNum}`] += Number(p.amount);
    });

    const revenueData = Object.keys(revenueMap).map((w) => ({
      name: w,
      value: revenueMap[w],
    }));

    // 3. Campaign Sectors
    const sectorCount: Record<string, number> = {};
    const totalBrands = (brands ?? []).length;
    (brands ?? []).forEach((b) => {
      const ind = b.industry || "General Tech";
      sectorCount[ind] = (sectorCount[ind] || 0) + 1;
    });

    let campaignSectors = Object.keys(sectorCount).map((s) => ({
      name: s,
      value: totalBrands > 0 ? Math.round((sectorCount[s] / totalBrands) * 100) : 0,
    }));

    if (campaignSectors.length === 0) {
      campaignSectors = [
        { name: "Unassigned", value: 100 },
      ];
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: {
        userGrowthData,
        revenueData,
        campaignSectors,
      },
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/analytics]", normalizedError);
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
