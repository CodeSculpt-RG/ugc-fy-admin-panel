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

    const resolvedEventIds = new Set(
      eventsList
        .map((event) => {
          const details = event.details && typeof event.details === "object" ? event.details as Record<string, unknown> : {};
          const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, unknown> : {};
          const eventType = String(metadata.type_override || details.type_override || event.event_type || event.type || "");
          if (eventType !== "event_resolved") return null;
          return String(details.resolved_event_id || metadata.resolved_event_id || "");
        })
        .filter((eventId): eventId is string => Boolean(eventId))
    );

    let unresolvedCount = 0;
    let criticalCount = 0;
    let highCount = 0;
    let wafFiltered = 0;
    let failedLoginCount24h = 0;
    let unauthorizedAccessCount24h = 0;
    let suspiciousActivityCount24h = 0;
    let latestIntegrityScan: string | null = null;
    let pendingCredentialRotationCount = 0;

    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const events = eventsList.flatMap((e) => {
      const details = e.details && typeof e.details === "object" ? (e.details as Record<string, unknown>) : {};
      const meta = e.metadata && typeof e.metadata === "object" ? (e.metadata as Record<string, unknown>) : details;
      const eType = meta.type_override ? String(meta.type_override) : String(e.event_type || e.type || "");
      if (eType === "event_resolved") return [];
      const normalizedStatus = String(e.status || "").toLowerCase();
      const isResolved = Boolean(
        e.resolved ||
        details.resolved ||
        meta.resolved ||
        normalizedStatus === "resolved" ||
        resolvedEventIds.has(String(e.id))
      );
      if (!isResolved) unresolvedCount += 1;

      const severity = e.severity ? String(e.severity).toLowerCase() : "low";
      if (!isResolved && severity === "critical") criticalCount += 1;
      if (!isResolved && severity === "high") highCount += 1;

      const eventTime = new Date(e.created_at).getTime();
      const isWithin24h = now - eventTime <= twentyFourHoursMs;

      if (isWithin24h) {
        if (eType === "login_failed") failedLoginCount24h += 1;
        if (eType === "unauthorized_access" || eType === "permission_denied") unauthorizedAccessCount24h += 1;
        if (eType === "suspicious_activity") suspiciousActivityCount24h += 1;
        if (eType === "waf_filtered" || eType === "rate_limited" || eType === "ddos_mitigation") wafFiltered += 1;
      }

      if (eType === "integrity_scan" && (!latestIntegrityScan || new Date(e.created_at) > new Date(latestIntegrityScan))) {
        latestIntegrityScan = e.created_at;
      }

      if (!isResolved && eType === "credential_rotation_required") {
        pendingCredentialRotationCount += 1;
      }

      return [{
        id: e.id,
        type: eType || "System Security Advisory",
        severity: severity.charAt(0).toUpperCase() + severity.slice(1),
        description: e.message || e.description || details.message || meta.message || "System security log recorded.",
        ip: e.ip_address || e.ip || "127.0.0.1",
        resolved: isResolved,
        created_at: e.created_at,
      }];
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
      .maybeSingle();

    const securitySettings = settingsRow && settingsRow.value && typeof settingsRow.value === "object"
      ? (settingsRow.value as Record<string, unknown>)
      : null;
    const credentialRotationConfigured = Boolean(
      securitySettings &&
      (
        securitySettings.credential_rotation_days ||
        securitySettings.credential_rotation_enabled ||
        pendingCredentialRotationCount > 0
      )
    );

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: {
        state,
        unresolvedCount,
        criticalCount,
        highCount,
        totalEvents: count ?? events.length,
        wafFiltered,
        failedLoginCount24h,
        unauthorizedAccessCount24h,
        suspiciousActivityCount24h,
        latestIntegrityScan,
        securitySettings,
        rotationDataConfigured: credentialRotationConfigured,
        unrotatedAdminCount: pendingCredentialRotationCount,
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
          wafFiltered: 0,
          failedLoginCount24h: 0,
          unauthorizedAccessCount24h: 0,
          suspiciousActivityCount24h: 0,
          latestIntegrityScan: null,
          securitySettings: null,
          isMissingTable: true,
          tableName: missingInfo.tableName,
          migrationSql: missingInfo.sql,
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
