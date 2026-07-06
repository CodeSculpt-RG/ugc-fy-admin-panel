import { NextResponse } from "next/server";
import { requireOwner, normalizeEmail, assertNotOwnerTarget } from "@/lib/auth/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAdminSecurityEvent } from "@/lib/auth/admin-security";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";

type RevokeRequestBody = {
  adminUserId?: string;
  status?: string;
  role?: string;
};

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request);
    const ip = getRequestIp(request);
    const userAgent = getUserAgent(request);

    const body = (await request.json().catch(() => ({}))) as RevokeRequestBody;
    const { adminUserId, status, role } = body;

    if (!adminUserId) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", message: "adminUserId is required." },
        { status: 400 }
      );
    }

    // 1. Fetch the target admin record
    const { data: targetAdmin, error: fetchErr } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("id", adminUserId)
      .single();

    if (fetchErr || !targetAdmin) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND", message: "Target admin user record not found." },
        { status: 404 }
      );
    }

    const targetEmail = normalizeEmail(targetAdmin.email);

    // 2. Safeguard: Block any destructive/modifying action on the owner account
    assertNotOwnerTarget(targetEmail);

    // 3. Prepare updates
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    let loggedEventType = "admin_user_updated";

    if (status) {
      const allowedStatuses = ["invited", "active", "suspended", "revoked"];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { ok: false, error: "VALIDATION_ERROR", message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.status = status;
      loggedEventType = status === "suspended" ? "admin_user_suspended" : status === "revoked" ? "admin_user_revoked" : "admin_user_activated";
    }

    if (role) {
      const allowedRoles = [
        "super_admin",
        "admin",
        "kyc_manager",
        "campaign_manager",
        "moderator",
        "support",
        "finance",
      ];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { ok: false, error: "VALIDATION_ERROR", message: `Invalid role. Must be one of: ${allowedRoles.join(", ")}` },
          { status: 400 }
        );
      }
      updates.role = role;
    }

    // If neither status nor role updates are supplied, assume simple revoke
    if (!status && !role) {
      updates.status = "revoked";
      loggedEventType = "admin_user_revoked";
    }

    // 4. Update DB
    const { data: updatedAdmin, error: updateErr } = await supabaseAdmin
      .from("admin_users")
      .update(updates)
      .eq("id", adminUserId)
      .select()
      .single();

    if (updateErr || !updatedAdmin) {
      console.error("[POST /api/admin/invites/revoke] update error:", updateErr);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR", message: updateErr?.message || "Failed to update record." },
        { status: 500 }
      );
    }

    // 5. Log event
    await logAdminSecurityEvent({
      adminUserId: owner.id,
      email: targetEmail,
      ipAddress: ip,
      userAgent,
      eventType: loggedEventType,
      severity: "warning",
      metadata: { targetAdminUserId: adminUserId, updates },
    });

    return NextResponse.json({ ok: true, success: true, data: updatedAdmin });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Access Denied: Owner authorization required.";
    console.error("[POST /api/admin/invites/revoke] authorization error:", errMsg);
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: errMsg },
      { status: 403 }
    );
  }
}
