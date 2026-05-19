import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requirePermission(request, "moderation.write");
    if (!check.ok) return check.response;

    const { id } = await params;
    const body = await request.json();

    let dbStatus: "pending" | "reviewing" | "resolved" | "dismissed" | "escalated" = "pending";
    const inStatus = String(body.status).toLowerCase();
    if (inStatus === "dismissed") dbStatus = "dismissed";
    else if (inStatus === "restricted" || inStatus === "resolved") dbStatus = "resolved";
    else if (inStatus === "pending review" || inStatus === "escalated") dbStatus = "escalated";
    else if (inStatus === "reviewing") dbStatus = "reviewing";
    else if (inStatus === "pending") dbStatus = "pending";

    const updatePayload: Record<string, unknown> = {
      status: dbStatus,
      updated_at: new Date().toISOString(),
    };

    if (body.reason !== undefined) {
      updatePayload.resolution_notes = body.reason || null;
    }
    if (body.assignedAdminId !== undefined) {
      updatePayload.assigned_admin_id = body.assignedAdminId || null;
    }
    if (dbStatus === "resolved" || dbStatus === "dismissed") {
      updatePayload.resolved_by = check.admin.id;
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data: modCase, error } = await supabaseAdmin
      .from("moderation_cases")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !modCase) {
      throw error || new Error("Failed to update moderation case.");
    }

    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: `moderation.${dbStatus}`,
      targetType: "moderation_case",
      targetId: id,
      metadata: { newStatus: dbStatus, reason: body.reason },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: modCase,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[PATCH /api/admin/moderation/[id]/resolve]`, normalizedError);
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
