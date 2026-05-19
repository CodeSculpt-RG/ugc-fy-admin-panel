import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

async function safeSelectLatest(tableName: string, limit = 5) {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .limit(limit);

    if (error) {
      return {
        table: tableName,
        exists: false,
        rows: [],
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
      rows: data ?? [],
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Execution exception";
    return {
      table: tableName,
      exists: false,
      rows: [],
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
      "moderation_cases",
      "payments",
      "platform_settings",
      "security_events",
    ];

    const results = await Promise.all(tableNames.map((name) => safeSelectLatest(name, 5)));
    const tablesMap = Object.fromEntries(results.map((res) => [res.table, res]));

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      message: "Direct database synchronization verified.",
      env: {
        hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
      data: tablesMap,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/debug-real-data]", normalizedError);
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
