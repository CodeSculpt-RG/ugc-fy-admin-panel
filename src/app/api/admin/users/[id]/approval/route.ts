import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body as { status: string; reason?: string };

    // Determine required permission based on action
    const requiredPermission =
      status === "blocked" ? "users.block" : "users.approve";

    const check = await requirePermission(request, requiredPermission);
    if (!check.ok) return check.response;

    if (!["approved", "rejected", "blocked", "pending_review"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid approval status protocol." },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      approval_status: status,
      updated_at: new Date().toISOString(),
    };

    // Only set kyc_status to approved or rejected if it's one of those
    if (status === "approved" || status === "rejected") {
      updatePayload.kyc_status = status;
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (updatedUser?.role === "brand") {
      const brandPayload: Record<string, unknown> = {
        approval_status: status,
        updated_at: new Date().toISOString(),
      };
      if (status === "approved" || status === "rejected") {
        brandPayload.kyc_status = status;
      }
      if (status === "approved") {
        brandPayload.onboarding_completed = true;
      }
      const { error: brandError } = await supabaseAdmin
        .from("brand_profiles")
        .update(brandPayload)
        .eq("user_id", id);
      if (brandError && brandError.code !== "PGRST204" && brandError.code !== "PGRST200") {
        console.error("[Approval] failed to sync brand_profile", brandError);
      }
    } else if (updatedUser?.role === "creator") {
      const creatorPayload: Record<string, unknown> = {
        approval_status: status,
        updated_at: new Date().toISOString(),
      };
      if (status === "approved" || status === "rejected") {
        creatorPayload.kyc_status = status;
      }
      const { error: creatorError } = await supabaseAdmin
        .from("creator_profiles")
        .update(creatorPayload)
        .eq("user_id", id);
      if (creatorError && creatorError.code !== "PGRST204" && creatorError.code !== "PGRST200") {
        console.error("[Approval] failed to sync creator_profile", creatorError);
      }
    }

    // Audit log
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: `user.${status}`,
      targetType: "user",
      targetId: id,
      metadata: { reason, newStatus: status },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: updatedUser,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[PATCH /api/admin/users/[id]/approval]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
