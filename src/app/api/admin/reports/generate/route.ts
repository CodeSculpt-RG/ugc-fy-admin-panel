import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

export async function POST(request: Request) {
  try {
    const check = await requirePermission(request, "reports.write");
    if (!check.ok) return check.response;

    const body = await request.json().catch((): null => null);
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          source: "real_supabase_database",
          error: {
            message: "Empty request body.",
            code: "EMPTY_PAYLOAD",
            details: "Report generation requires parameters.",
            hint: null,
          },
        },
        { status: 400 }
      );
    }

    const { title, type, dateRange, format, notes } = body as {
      title?: string;
      type?: string;
      dateRange?: string;
      format?: string;
      notes?: string;
    };

    const resolvedTitle = title || `${type || "General"} Intelligence Report - ${new Date().toISOString().split("T")[0]}`;
    const resolvedType = type || "Security";
    const resolvedFormat = format || "json";

    const { data: report, error } = await supabaseAdmin
      .from("reports")
      .insert({
        title: resolvedTitle,
        type: resolvedType,
        payload: { dateRange, format: resolvedFormat, notes },
        status: "Generating",
        file_url: `https://storage.ugc-fy.in/reports/${Date.now()}_${resolvedFormat}.${resolvedFormat}`,
        generated_by: check.admin.id,
      })
      .select()
      .single();

    if (error) throw error;

    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: "report.generate",
      targetType: "report",
      targetId: report.id,
      metadata: { title: resolvedTitle, type: resolvedType, format: resolvedFormat },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      message: "Report generated successfully.",
      data: report,
      count: 1,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[POST /api/admin/reports/generate]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
