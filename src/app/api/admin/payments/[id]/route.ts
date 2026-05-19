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
    const check = await requirePermission(request, "payments.write");
    if (!check.ok) return check.response;

    const { id } = await params;
    const body = await request.json();

    const allowedFields = ["status", "reviewed"];
    const updates: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (updates.status !== undefined) {
      const validStatuses = ["pending", "paid", "failed", "refunded", "cancelled", "processing", "disputed"];
      if (typeof updates.status !== "string" || !validStatuses.includes(updates.status)) {
        return NextResponse.json(
          {
            success: false,
            source: "real_supabase_database",
            error: {
              message: `Invalid payment status value: '${updates.status}'`,
              code: "INVALID_PAYMENT_STATUS",
              details: null,
              hint: `Must be one of: ${validStatuses.join(", ")}`,
            },
          },
          { status: 400 }
        );
      }
    }

    if (updates.reviewed !== undefined) {
      updates.reviewed_at = new Date().toISOString();
      updates.reviewed_by = check.admin.id;
    }

    updates.updated_at = new Date().toISOString();

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !payment) {
      throw error || new Error("Failed to update payment record.");
    }

    await writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: `PATCH payment: ${JSON.stringify(updates)}`,
      targetType: "payments",
      targetId: id,
      metadata: { updates },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: payment,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[PATCH /api/admin/payments/[id]]`, normalizedError);
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
