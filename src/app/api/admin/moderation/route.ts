import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";
import { getMissingTableInfo } from "@/lib/api/migrationSql";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "moderation.read");
    if (!check.ok) return check.response;

    const { data, error } = await supabaseAdmin
      .from("moderation_cases")
      .select(`
        id,
        case_type,
        status,
        priority,
        title,
        description,
        reported_by,
        target_user_id,
        target_profile_id,
        target_type,
        target_id,
        assigned_admin_id,
        resolved_by,
        resolution_notes,
        metadata,
        created_at,
        updated_at,
        resolved_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: data ?? [],
      count: data?.length ?? 0,
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
        data: [],
        count: 0,
      });
    }

    console.error("[GET /api/admin/moderation]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
