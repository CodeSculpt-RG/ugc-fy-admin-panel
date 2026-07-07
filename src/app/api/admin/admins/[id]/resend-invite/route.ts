import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { writeAuditLog } from "@/lib/api/writeAuditLog";
import { normalizeError } from "@/lib/api/normalizeError";

export const dynamic = 'force-dynamic';

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeout: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`${label}_TIMEOUT`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requirePermission(request, "admin_management.write");
    if (!check.ok) return check.response;

    const resolvedParams = await params;
    const adminId = resolvedParams.id;
    if (!adminId) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Admin ID is required." } },
        { status: 400 }
      );
    }

    // Must be owner or super admin (owner already protected in route level but let's be safe)
    if (check.admin.role !== "owner" && check.admin.role !== "super_admin") {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Access Denied: Only owners and super admins can resend invites." } },
        { status: 403 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("admin_users")
      .select("id, email, full_name, role, status")
      .eq("id", adminId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Admin profile not found." } },
        { status: 404 }
      );
    }

    if (profile.status === "active") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_STATE", message: "Admin has already accepted their invite." } },
        { status: 400 }
      );
    }

    if (profile.status === "revoked") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_STATE", message: "Admin invite is revoked. Use reactivation instead." } },
        { status: 400 }
      );
    }

    // Call Supabase inviteUserByEmail
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = `${appUrl}/admin/auth/callback?next=/admin/force-password-change`;

    let inviteResponse;
    try {
      inviteResponse = await withTimeout(
        supabaseAdmin.auth.admin.inviteUserByEmail(profile.email, {
          redirectTo,
          data: {
            full_name: profile.full_name,
            admin_role: profile.role,
            role: "admin",
            created_as_admin: true,
          },
        }),
        15000,
        'SUPABASE_INVITE'
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'SUPABASE_INVITE_TIMEOUT') {
        return NextResponse.json(
          { ok: false, error: { code: "SUPABASE_INVITE_TIMEOUT", message: "Supabase invite email request timed out. Check Supabase Auth email/SMTP configuration and retry." } },
          { status: 504 }
        );
      }
      throw error;
    }

    const { error: inviteError } = inviteResponse;

    let mappedErrorCode = "SUPABASE_INVITE_FAILED";
    let mappedErrorMessage = inviteError?.message || "Supabase could not send the admin invite email.";
    
    if (inviteError) {
      const msg = inviteError.message?.toLowerCase() || "";
      if (msg.includes("already been registered")) {
        mappedErrorCode = "SUPABASE_INVITE_NOT_SENT_EXISTING_USER";
        mappedErrorMessage = "Supabase did not send another invite because this email already belongs to an existing Auth user. Use password reset/setup flow or reactivate the admin profile.";
      } else if (msg.includes("rate limit") || msg.includes("rate_limit")) {
        mappedErrorCode = "SUPABASE_EMAIL_RATE_LIMITED";
        mappedErrorMessage = "Supabase email rate limit was reached. Wait before retrying or configure custom SMTP in Supabase Auth.";
      } else if (msg.includes("redirect url") || msg.includes("not allowed")) {
        mappedErrorCode = "SUPABASE_REDIRECT_URL_NOT_ALLOWED";
        mappedErrorMessage = "Supabase redirect URL is not configured or allowed.";
      } else if (msg.includes("smtp") || msg.includes("provider") || msg.includes("unable to send email")) {
        mappedErrorCode = "SUPABASE_EMAIL_PROVIDER_FAILED";
        mappedErrorMessage = "Supabase email provider failed. Check SMTP/Auth email settings.";
      }
    }

    if (inviteError) {
      return NextResponse.json(
        { ok: false, error: { code: mappedErrorCode, message: mappedErrorMessage } },
        { status: mappedErrorCode === "SUPABASE_INVITE_NOT_SENT_EXISTING_USER" ? 400 : 502 }
      );
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({
        status: "invited",
        invited_at: now,
        updated_at: now,
      })
      .eq("id", adminId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: { code: "ADMIN_PROFILE_UPDATE_FAILED", message: updateError.message } },
        { status: 500 }
      );
    }

    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: "admin.invite_resent",
      targetType: "admin",
      targetId: adminId,
      metadata: { email: profile.email, status: "pending" },
    }).catch((e) => {
      if (process.env.NODE_ENV === 'development') console.warn('[admin-resend-invite] activity log failed:', e);
    });

    return NextResponse.json({
      ok: true,
      success: true,
      message: "Invite resent successfully.",
    });

  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[POST /api/admin/admins/[id]/resend-invite]", normalizedError);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: normalizedError.message } },
      { status: 500 }
    );
  }
}
