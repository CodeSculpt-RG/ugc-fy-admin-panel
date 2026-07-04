import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { decision, reason, internal_notes } = body as { decision: string; reason?: string; internal_notes?: string };

    const check = await requirePermission(request, decision === "rejected" ? "kyc.reject" : "kyc.approve");
    if (!check.ok) return check.response;

    if (!["approved", "rejected", "needs_review"].includes(decision)) {
      return NextResponse.json(
        { ok: false, error: "Invalid KYC decision protocol." },
        { status: 400 }
      );
    }

    if (decision === "rejected" && !reason) {
      return NextResponse.json(
        { ok: false, error: "Rejection requires a reason." },
        { status: 400 }
      );
    }

    // 1. Fetch current KYC submission
    const { data: currentKyc, error: kycError } = await supabaseAdmin
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kycError || !currentKyc) {
      return NextResponse.json(
        { ok: false, error: "No pending KYC submission found." },
        { status: 404 }
      );
    }

    // 2. Update KYC Submission
    const updatePayload: Record<string, unknown> = {
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by_admin_id: check.admin.id,
      rejection_reason: decision === "rejected" ? reason : null,
      internal_notes: internal_notes ?? currentKyc.internal_notes,
      updated_at: new Date().toISOString()
    };

    const { data: updatedKyc, error: updateKycError } = await supabaseAdmin
      .from("kyc_submissions")
      .update(updatePayload)
      .eq("id", currentKyc.id)
      .select()
      .single();

    if (updateKycError) throw updateKycError;

    // 3. Update Global Profile Status
    // Align kyc_status with the new decision.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ kyc_status: decision === "needs_review" ? "pending_review" : decision, updated_at: new Date().toISOString() })
      .eq("id", id);
      
    if (profileError) console.error("[POST KYC] Failed to sync profile kyc_status", profileError);

    if (currentKyc.role === "brand") {
      const brandPayload: Record<string, unknown> = {
        kyc_status: decision === "needs_review" ? "pending_review" : decision,
        updated_at: new Date().toISOString(),
      };
      if (decision === "approved") {
        brandPayload.onboarding_completed = true;
      }
      const { error: brandError } = await supabaseAdmin
        .from("brand_profiles")
        .update(brandPayload)
        .eq("user_id", id);
      if (brandError) {
        console.error("[POST KYC] Failed to sync brand_profiles", brandError);
      }
    }

    // 4. Create KYC Review Event
    const { error: eventError } = await supabaseAdmin
      .from("kyc_review_events")
      .insert({
        kyc_submission_id: currentKyc.id,
        user_id: id,
        admin_id: check.admin.id,
        action: decision === "needs_review" ? "requested_changes" : decision,
        before_status: currentKyc.status,
        after_status: decision,
        reason: reason ?? null,
        metadata: {
          changedFields: ['status'],
          internalNotesUpdated: !!internal_notes
        }
      });

    if (eventError) console.error("[POST KYC] Failed to create event", eventError);

    // 5. Write Global Audit Log
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: `kyc.${decision}`,
      targetType: "user",
      targetId: id,
      metadata: { kycSubmissionId: currentKyc.id, beforeStatus: currentKyc.status, afterStatus: decision, reason },
    });

    return NextResponse.json({
      ok: true,
      kyc: updatedKyc
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[POST /api/admin/users/[id]/kyc/decision]", normalizedError);
    return NextResponse.json(
      { ok: false, error: normalizedError },
      { status: 500 }
    );
  }
}
