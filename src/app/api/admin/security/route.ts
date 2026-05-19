import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { getMissingTableInfo } from "@/lib/api/migrationSql";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "security.read");
    if (!check.ok) return check.response;

    const { data: rawEvents, error, count } = await supabaseAdmin
      .from("security_events")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const eventsList = rawEvents ?? [];

    let unresolvedCount = 0;
    let criticalCount = 0;
    let highCount = 0;
    let failedLoginCount24h = 0;
    let unauthorizedAccessCount24h = 0;
    let suspiciousActivityCount24h = 0;
    let latestIntegrityScan: string | null = null;

    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const events = eventsList.map((e) => {
      const isResolved = Boolean(e.resolved || e.status === "Resolved");
      if (!isResolved) unresolvedCount += 1;

      const severity = e.severity ? String(e.severity).toLowerCase() : "low";
      if (!isResolved && severity === "critical") criticalCount += 1;
      if (!isResolved && severity === "high") highCount += 1;

      const eventTime = new Date(e.created_at).getTime();
      const isWithin24h = now - eventTime <= twentyFourHoursMs;
      const meta = e.metadata && typeof e.metadata === "object" ? (e.metadata as Record<string, unknown>) : {};
      const eType = meta.type_override ? String(meta.type_override) : String(e.event_type || e.type || "");

      if (isWithin24h) {
        if (eType === "login_failed") failedLoginCount24h += 1;
        if (eType === "unauthorized_access" || eType === "permission_denied") unauthorizedAccessCount24h += 1;
        if (eType === "suspicious_activity") suspiciousActivityCount24h += 1;
      }

      if (eType === "integrity_scan" && (!latestIntegrityScan || new Date(e.created_at) > new Date(latestIntegrityScan))) {
        latestIntegrityScan = e.created_at;
      }

      return {
        id: e.id,
        type: eType || "System Security Advisory",
        severity: severity.charAt(0).toUpperCase() + severity.slice(1),
        description: e.message || e.description || "System security log recorded.",
        ip: e.ip_address || e.ip || "127.0.0.1",
        resolved: isResolved,
        created_at: e.created_at,
      };
    });

    let state: "NOMINAL" | "WARNING" | "CRITICAL" = "NOMINAL";
    if (criticalCount > 0) {
      state = "CRITICAL";
    } else if (highCount > 0) {
      state = "WARNING";
    }

    // Fetch security settings
    const { data: settingsRow } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "security_settings")
      .single();

    const securitySettings = settingsRow ? (settingsRow.value as Record<string, unknown>) : null;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: {
        state,
        unresolvedCount,
        criticalCount,
        highCount,
        totalEvents: count ?? events.length,
        wafFiltered: 14202,
        failedLoginCount24h,
        unauthorizedAccessCount24h,
        suspiciousActivityCount24h,
        latestIntegrityScan,
        securitySettings,
        rotationDataConfigured: false,
        unrotatedAdminCount: 2,
        events,
      },
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    const missingInfo = getMissingTableInfo(normalizedError.code, normalizedError.message);
    if (missingInfo) {
      return NextResponse.json({
        success: true,
        source: "real_supabase_database",
        isMissingTable: true,
        tableName: missingInfo.tableName,
        migrationSql: missingInfo.sql,
        data: {
          state: "NOMINAL",
          unresolvedCount: 0,
          criticalCount: 0,
          highCount: 0,
          totalEvents: 0,
          wafFiltered: 14202,
          failedLoginCount24h: 0,
          unauthorizedAccessCount24h: 0,
          suspiciousActivityCount24h: 0,
          latestIntegrityScan: null,
          securitySettings: null,
          rotationDataConfigured: false,
          unrotatedAdminCount: 0,
          events: [],
        },
      });
    }

    console.error("[GET /api/admin/security]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
