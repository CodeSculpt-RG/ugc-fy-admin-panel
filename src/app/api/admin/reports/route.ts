import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "reports.read");
    if (!check.ok) return check.response;

    const { data, error } = await supabaseAdmin
      .from("reports")
      .select(`
        id,
        title,
        type,
        payload,
        file_url,
        status,
        generated_by,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      const isMissing =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes("updated_at");

      if (isMissing) {
        return NextResponse.json({
          success: true,
          source: "real_supabase_database",
          isMissingTable: true,
          tableName: "reports",
          migrationSql: `
-- Migration SQL for reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled Report',
  type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'generated',
  payload jsonb DEFAULT '{}'::jsonb,
  file_url text,
  generated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can access reports" ON public.reports;
CREATE POLICY "Admins can access reports" ON public.reports FOR ALL USING (true);`,
          data: [],
          count: 0,
          automationSettings: null,
        });
      }

      throw error;
    }

    const records = data ?? [];

    const profileIds = Array.from(
      new Set(
        records
          .map((r) => r.generated_by)
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
      const prof = r.generated_by ? profileMap.get(r.generated_by) : null;
      const statusStr = String(r.status || "Ready");
      let paramDesc = "Automated compliance package.";
      if (r.payload && typeof r.payload === "object") {
        const pObj = r.payload as Record<string, unknown>;
        const range = pObj.dateRange || "Platform Audit";
        const fmt = String(pObj.format || "json").toUpperCase();
        paramDesc = `Format: ${fmt} | Range: ${range}${pObj.notes ? ` | Notes: ${pObj.notes}` : ""}`;
      }

      return {
        id: String(r.id || "unknown"),
        title: String(r.title || "General Compliance Report"),
        name: String(r.title || "General Compliance Report"),
        type: String(r.type || "Security"),
        period: "Platform Audit",
        status: statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase(),
        date: r.created_at
          ? new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
          : new Date().toLocaleDateString(),
        description: paramDesc,
        reporter: prof?.full_name || prof?.email || String(r.generated_by || "System Auditor"),
        target: "Ecosystem Target",
        file_url: r.file_url || "#",
        fileUrl: r.file_url || "#",
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    // Fetch report automation settings if available
    const { data: settingsRow } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "report_automation")
      .maybeSingle();

    const automationSettings = settingsRow ? (settingsRow.value as Record<string, unknown>) : null;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: formattedData,
      count: formattedData.length,
      automationSettings,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/reports]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
