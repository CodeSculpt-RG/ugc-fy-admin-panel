import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "escrow.read");
    if (!check.ok) return check.response;

    const { data, error } = await supabaseAdmin
      .from("escrow_records")
      .select("id, campaign_id, brand_id, creator_id, amount, status, release_date, created_at, campaign:campaigns(id, title)")
      .order("created_at", { ascending: false });

    if (error) {
      const isMissing = error.code === "PGRST205" || error.code === "42P01" || error.message.includes("does not exist") || error.message.includes("Could not find the table");
      if (isMissing) {
        return NextResponse.json({
          success: true,
          source: "real_supabase_database",
          isMissingTable: true,
          tableName: "escrow_records",
          migrationSql: "-- Create escrow_records table\nCREATE TABLE IF NOT EXISTS public.escrow_records (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  campaign_id uuid NOT NULL REFERENCES public.campaigns(id),\n  brand_id uuid NOT NULL REFERENCES public.profiles(id),\n  creator_id uuid NOT NULL REFERENCES public.profiles(id),\n  amount numeric(12, 2) NOT NULL,\n  status text NOT NULL DEFAULT 'Held' CHECK (status IN ('Held', 'Released', 'Frozen', 'Disputed', 'Refunded')),\n  release_date timestamptz,\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);",
          data: [],
          count: 0,
        });
      }

      return NextResponse.json(
        {
          success: false,
          source: "real_supabase_database",
          error: {
            message: error.message,
            code: error.code ?? "UNKNOWN",
            details: error.details ?? null,
            hint: error.hint ?? null,
          },
        },
        { status: 500 }
      );
    }

    const records = data ?? [];

    const profileIds = Array.from(
      new Set(
        records
          .flatMap((r) => [r.brand_id, r.creator_id])
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    let profiles: Array<{ id: string; email: string | null; full_name: string | null }> = [];
    if (profileIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", profileIds);
      if (profs) profiles = profs;
    }
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const formattedData = records.map((r) => {
      const brandProf = r.brand_id ? profileMap.get(r.brand_id) : null;
      const creatorProf = r.creator_id ? profileMap.get(r.creator_id) : null;
      const campObj = r.campaign && typeof r.campaign === 'object' && !Array.isArray(r.campaign) ? (r.campaign as { title?: string }) : null;

      const amtNum = Number(r.amount || 0);
      const statusStr = String(r.status || "Held");
      const normalizedStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();
      const validStatuses = ["Held", "Released", "Frozen", "Disputed"];
      const finalStatus = validStatuses.includes(normalizedStatus) ? normalizedStatus : "Held";

      return {
        id: String(r.id || "unknown"),
        campaign: campObj?.title || `Campaign ID_${String(r.campaign_id || "unknown").slice(0, 8)}`,
        brand: brandProf?.full_name || brandProf?.email || "Unknown Brand",
        creator: creatorProf?.full_name || creatorProf?.email || "Unknown Creator",
        amount: `$${amtNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: finalStatus,
        releaseDate: r.release_date ? new Date(r.release_date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "Pending Release",
      };
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/escrow]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
