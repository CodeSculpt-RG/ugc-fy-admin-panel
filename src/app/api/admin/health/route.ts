import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

async function safeCountTable(tableName: string) {
  try {
    const { count, error } = await supabaseAdmin
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      return {
        table: tableName,
        exists: false,
        count: 0,
        error: {
          message: error.message,
          code: error.code ?? "UNKNOWN",
          details: error.details ?? null,
          hint: error.hint ?? null,
        },
      };
    }

    return {
      table: tableName,
      exists: true,
      count: count ?? 0,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Execution exception";
    return {
      table: tableName,
      exists: false,
      count: 0,
      error: {
        message: errorMsg,
        code: "UNKNOWN",
        details: null,
        hint: null,
      },
    };
  }
}

export async function GET(request: Request) {
  try {
    const permissionCheck = await requirePermission(request, "infrastructure.read");
    if (!permissionCheck.ok) return permissionCheck.response;

    const tableNames = [
      "profiles",
      "creator_profiles",
      "brand_profiles",
      "admin_profiles",
      "admin_role_permissions",
      "audit_logs",
      "campaigns",
      "payments",
      "escrow_records",
      "disputes",
      "moderation_cases",
      "platform_settings",
      "security_events",
      "reports",
      "admin_invites",
    ];

    const tables = await Promise.all(tableNames.map((name) => safeCountTable(name)));

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: {
        supabaseConnected: true,
        checkedAt: new Date().toISOString(),
        tables,
      },
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/health]", normalizedError);
    return NextResponse.json(
      {
        success: false,
        supabaseConnected: false,
        source: "real_supabase_database",
        error: normalizedError,
      },
      { status: 500 }
    );
  }
}
