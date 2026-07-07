import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "admin_management.read");
    if (!check.ok) return check.response;

    const { data: admins, error, count } = await supabaseAdmin
      .from("admin_users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: admins ?? [],
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/admins]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}



import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

const debugTimings = process.env.DEBUG_ADMIN_INVITE === "true";
function logTiming(label: string, start: number) {
  if (debugTimings) {
    console.log(`[admin-invite] ${label} ms: ${Date.now() - start}`);
  }
}

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

export async function POST(request: Request) {
  const t0 = Date.now();
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { ok: false, error: { code: "SUPABASE_SERVICE_ROLE_NOT_CONFIGURED", message: "Supabase service role is not configured on the server." } },
        { status: 500 }
      );
    }

    // 1. Require admin_management.write permission
    const tVerify = Date.now();
    const check = await requirePermission(request, "admin_management.write");
    if (!check.ok) return check.response;
    logTiming("verify admin", tVerify);

    const tParse = Date.now();
    const body = await request.json();
    const { email, full_name, fullName, role } = body;

    // 2. Validate email, full_name, role
    if (!email || (!full_name && !fullName)) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Email and Full Name are required." } },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = (full_name || fullName || email.split("@")[0]).trim();
    const resolvedRole = (role || "support_admin").toLowerCase().trim();

    const allowedRoles = [
      "owner",
      "super_admin",
      "moderation_admin",
      "finance_admin",
      "support_admin",
      "analyst",
    ] as const;

    if (!allowedRoles.includes(resolvedRole as typeof allowedRoles[number])) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: `Invalid access role vector: ${resolvedRole}` } },
        { status: 400 }
      );
    }

    // OWNER protection: only owner can create another owner or super admin
    if ((resolvedRole === "owner" || resolvedRole === "super_admin") && check.admin.role !== "owner") {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Access Denied: Only active platform owners can provision highly privileged roles." } },
        { status: 403 }
      );
    }
    
    // Check if the user is attempting to create a role higher than their own (owner already handled)
    if (check.admin.role !== "owner" && check.admin.role !== "super_admin") {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Access Denied: Only owners and super admins can provision new admins." } },
        { status: 403 }
      );
    }
    logTiming("parse payload", tParse);

    // 3. Check existing admin_users
    const tProfile = Date.now();
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("admin_users")
      .select("id, status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileCheckError) throw profileCheckError;

    if (existingProfile) {
      const status = existingProfile.status;

      if (status === "active") {
        return NextResponse.json(
          { ok: false, error: { code: "ADMIN_ALREADY_EXISTS", message: "This email is already an active admin.", details: { adminId: existingProfile.id } } },
          { status: 409 }
        );
      } else if (status === "invited") {
        return NextResponse.json(
          { ok: false, error: { code: "ADMIN_INVITE_ALREADY_PENDING", message: "An invite is already pending for this email.", details: { adminId: existingProfile.id } } },
          { status: 409 }
        );
      } else if (status === "suspended") {
        return NextResponse.json(
          { ok: false, error: { code: "ADMIN_SUSPENDED", message: "This admin is suspended.", details: { adminId: existingProfile.id } } },
          { status: 409 }
        );
      } else if (status === "revoked") {
        return NextResponse.json(
          { ok: false, error: { code: "ADMIN_REVOKED_REQUIRES_REACTIVATION", message: "This admin was revoked and requires explicit reactivation.", details: { adminId: existingProfile.id } } },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { ok: false, error: { code: "ADMIN_ALREADY_EXISTS", message: "This email is already registered as an admin.", details: { adminId: existingProfile.id } } },
          { status: 409 }
        );
      }
    }
    logTiming("duplicate profile check", tProfile);

    // 4. Send Supabase invite email
    const tInvite = Date.now();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = `${appUrl}/admin/auth/callback?next=/admin/force-password-change`;

    let inviteResponse;
    try {
      inviteResponse = await withTimeout(
        supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
          redirectTo,
          data: {
            full_name: normalizedFullName,
            admin_role: resolvedRole,
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
    logTiming("inviteUserByEmail", tInvite);

    const { data: authData, error: inviteError } = inviteResponse;

    let mappedErrorCode = "SUPABASE_INVITE_FAILED";
    let mappedErrorMessage = inviteError?.message || "Supabase could not send the admin invite email.";
    
    if (inviteError) {
      const msg = inviteError.message?.toLowerCase() || "";
      
      if (msg.includes("user already registered") || msg.includes("already exists")) {
        // They exist in auth.users. Retrieve their user_id from the profiles table.
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, user_id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existingProfile?.user_id) {
          const authUserId = existingProfile.user_id;

          // Link them into admin_users
          const now = new Date().toISOString();
          const { error: profileError } = await supabaseAdmin
            .from("admin_users")
            .upsert({
              user_id: authUserId,
              email: normalizedEmail,
              full_name: normalizedFullName,
              role: resolvedRole,
              status: "active",
              password_enabled: true, // They already have an account
              invited_by: check.admin.id,
              invited_at: now,
              updated_at: now,
            }, { onConflict: "email" });

          if (profileError) {
            return NextResponse.json(
              { ok: false, error: { code: "ADMIN_PROFILE_CREATE_FAILED", message: profileError.message } },
              { status: 500 }
            );
          }

          void writeAuditLog({
            actorAdminId: check.admin.id,
            actorRole: check.admin.role,
            action: "admin.linked_existing_auth_user",
            targetType: "admin",
            targetId: authUserId,
            metadata: { email: normalizedEmail, role: resolvedRole },
          });

          return NextResponse.json({
            ok: true,
            admin: {
              id: authUserId,
              email: normalizedEmail,
              full_name: normalizedFullName,
              role: resolvedRole,
              status: "active",
            },
            email: {
              sent: false,
              provider: "none",
            },
            message: "Admin access was granted, but no invite email was sent because this user already exists."
          });
        } else {
          return NextResponse.json(
            { ok: false, error: { code: "AUTH_USER_ALREADY_EXISTS", message: "A Supabase Auth user already exists but has no profile. Cannot link." } },
            { status: 409 }
          );
        }
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

    if (inviteError || !authData?.user) {
      void writeAuditLog({
        actorAdminId: check.admin.id,
        actorRole: check.admin.role,
        action: "admin.invite_failed",
        targetType: "admin",
        targetId: normalizedEmail,
        metadata: { email: normalizedEmail, role: resolvedRole, reason: mappedErrorMessage, original_error: inviteError?.message },
      }).catch((e) => {
        if (process.env.NODE_ENV === 'development') console.warn('[admin-invite] activity log failed:', e);
      });

      return NextResponse.json(
        { ok: false, error: { code: mappedErrorCode, message: mappedErrorMessage } },
        { status: 502 }
      );
    }
    
    const authUserId: string = authData.user.id;

    // 5. Insert admin_users
    const tUpsert = Date.now();
    const now = new Date().toISOString();
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("admin_users")
      .upsert({
        user_id: authUserId,
        email: normalizedEmail,
        full_name: normalizedFullName,
        role: resolvedRole,
        status: "invited",
        password_enabled: false,
        invited_by: check.admin.id,
        invited_at: now,
        updated_at: now,
      }, { onConflict: "email" })
      .select("*")
      .single();

    if (profileError) {
      // We cannot easily rollback an invite, but we can log it.
      return NextResponse.json(
        { ok: false, error: { code: "ADMIN_PROFILE_CREATE_FAILED", message: profileError.message } },
        { status: 500 }
      );
    }
    logTiming("profile upsert", tUpsert);

    // 6. Write audit logs
    const tAuditSuccess = Date.now();
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: "admin.created",
      targetType: "admin",
      targetId: authUserId,
      metadata: { email: normalizedEmail, role: resolvedRole },
    }).catch((e) => {
      if (process.env.NODE_ENV === 'development') console.warn('[admin-invite] activity log failed:', e);
    });
    
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: "admin.invite_sent",
      targetType: "admin",
      targetId: authUserId,
      metadata: { email: normalizedEmail, emailProvider: "supabase_auth" },
    }).catch((e) => {
      if (process.env.NODE_ENV === 'development') console.warn('[admin-invite] activity log failed:', e);
    });
    logTiming("activity log queued", tAuditSuccess);

    // 7. Return success message
    logTiming("total", t0);
    return NextResponse.json({
      ok: true,
      admin: {
        id: adminProfile.id,
        email: adminProfile.email,
        full_name: adminProfile.full_name,
        role: adminProfile.role,
        status: adminProfile.status,
      },
      email: {
        sent: true,
        provider: "supabase_auth",
      },
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);

    console.error("[POST /api/admin/admins]", normalizedError);

    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: normalizedError.message || "Internal server error" },
      },
      { status: 500 }
    );
  }
}
