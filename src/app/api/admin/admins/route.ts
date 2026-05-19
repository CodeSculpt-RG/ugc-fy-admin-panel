import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

function generateTemporaryPassword(): string {
  return `${crypto.randomBytes(12).toString("base64url")}A1!`;
}

function getEmailErrorDetails(error: unknown) {
  if (!error) {
    return {
      message: "Unknown email delivery error.",
      code: "EMAIL_UNKNOWN",
      details: null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "EMAIL_ERROR",
      details: error.stack ?? null,
    };
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;

    return {
      message:
        typeof record.message === "string"
          ? record.message
          : "Email provider returned an object error.",
      code:
        typeof record.name === "string"
          ? record.name
          : typeof record.code === "string"
            ? record.code
            : "EMAIL_PROVIDER_ERROR",
      details: JSON.stringify(record),
    };
  }

  return {
    message: String(error),
    code: "EMAIL_STRING_ERROR",
    details: null,
  };
}

function buildAdminCredentialEmailHtml(input: {
  fullName: string;
  email: string;
  temporaryPassword: string;
  role: string;
  loginUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #e6e9ef;">
<tr>
<td style="padding:30px 34px;background:linear-gradient(135deg,#040720,#111a45);">
<div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:0.08em;">UGC FY</div>
<div style="margin-top:7px;font-size:13px;color:rgba(255,255,255,0.68);">Admin Access Credentials</div>
</td>
</tr>
<tr>
<td style="padding:36px 34px;">
<h2 style="margin:0 0 12px;font-size:24px;color:#111827;">You’ve been assigned admin access</h2>
<p style="font-size:15px;color:#5f6b7a;line-height:1.7;">Hello <strong>${input.fullName}</strong>,</p>
<p style="font-size:15px;color:#5f6b7a;line-height:1.7;">You have been appointed as an administrator for the <strong>UGC FY Admin Panel</strong>.</p>

<div style="background:#f8fafc;border:1px solid #edf1f6;border-radius:15px;padding:20px;margin:24px 0;">
<p><strong>Login URL:</strong> <a href="${input.loginUrl}" style="color:#2563eb;">${input.loginUrl}</a></p>
<p><strong>Email:</strong> ${input.email}</p>
<p><strong>Temporary Password:</strong></p>
<div style="font-family:Courier New,monospace;font-size:18px;font-weight:800;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;color:#111827;">${input.temporaryPassword}</div>
<p><strong>Assigned Role:</strong> ${input.role.replaceAll("_", " ")}</p>
</div>

<p style="font-size:14px;color:#b45309;font-weight:700;">For security, you must change this password immediately after first login.</p>

<a href="${input.loginUrl}" style="display:inline-block;margin-top:16px;padding:14px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:13px;font-weight:800;">Login to Admin Panel</a>

<p style="margin-top:24px;font-size:13px;color:#6b7280;line-height:1.6;">If you were not expecting admin access, contact the UGC FY owner immediately.</p>
</td>
</tr>
<tr>
<td style="padding:24px 34px;background:#040720;">
<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.72);">UGC FY Platform · Admin Access System</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
}

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "admin_management.read");
    if (!check.ok) return check.response;

    const { data: admins, error, count } = await supabaseAdmin
      .from("admin_profiles")
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

export async function POST(request: Request) {
  try {
    // 2. Require admin_management.write permission
    const check = await requirePermission(request, "admin_management.write");
    if (!check.ok) return check.response;

    const body = await request.json();
    const { email, full_name, fullName, role } = body;

    // 1. Validate email, full_name, role
    if (!email || !full_name && !fullName) {
      return NextResponse.json(
        { success: false, source: "real_supabase_database", error: { message: "Email and Full Name are required." } },
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
        { success: false, source: "real_supabase_database", error: { message: `Invalid access role vector: ${resolvedRole}` } },
        { status: 400 }
      );
    }

    // OWNER protection: only owner can create another owner
    if (resolvedRole === "owner" && check.admin.role !== "owner") {
      return NextResponse.json(
        { success: false, source: "real_supabase_database", error: { message: "Access Denied: Only active platform owners can provision new owners." } },
        { status: 403 }
      );
    }

    // 3. Generate strong temporary password
    const temporaryPassword = generateTemporaryPassword();

    // 4. Find auth user by email
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    const existingAuthUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    let authUserId;

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
      // 5. If user exists, update password and user_metadata
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: temporaryPassword,
        user_metadata: {
          full_name: normalizedFullName,
          admin_role: resolvedRole,
          must_change_password: true,
        },
      });
      if (updateAuthError) throw updateAuthError;
    } else {
      // 6. If user does not exist, create user
      const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        password: temporaryPassword,
        user_metadata: {
          full_name: normalizedFullName,
          admin_role: resolvedRole,
          must_change_password: true,
        },
      });

      if (createUserError) throw createUserError;
      authUserId = authData.user.id;
    }

    // 7. Upsert admin_profiles with operational variables
    const now = new Date().toISOString();
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .upsert(
        {
          id: authUserId,
          email: normalizedEmail,
          full_name: normalizedFullName,
          role: resolvedRole,
          is_active: true,
          invited_by: check.admin.id,
          must_change_password: true,
          temp_password_issued_at: now,
          updated_at: now,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (profileError) throw profileError;

    // 8. Send email using Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://adminpanel-nine-murex.vercel.app"}/admin/login`;

    const adminCredentialEmailHtml = buildAdminCredentialEmailHtml({
      fullName: normalizedFullName,
      email: normalizedEmail,
      temporaryPassword,
      role: resolvedRole,
      loginUrl,
    });

    const emailResult = await resend.emails.send({
      from: process.env.ADMIN_EMAIL_FROM || "UGC FY Admin <onboarding@resend.dev>",
      to: normalizedEmail,
      subject: "UGC FY Admin Access Credentials",
      html: adminCredentialEmailHtml,
    });

    // 9. If email fails, return warning clearly
    if (emailResult.error) {
      const emailErrorDetails = getEmailErrorDetails(emailResult.error);

      console.error("[POST /api/admin/admins] Credential email failed:", {
        email: normalizedEmail,
        ...emailErrorDetails,
      });

      return NextResponse.json(
        {
          success: false,
          source: "email_delivery",
          error: {
            message: "Admin was created, but credential email failed to send.",
            code: "EMAIL_SEND_FAILED",
            details:
              emailErrorDetails.details ||
              emailErrorDetails.message ||
              "Email provider did not return detailed error information.",
            hint:
              "Check RESEND_API_KEY, ADMIN_EMAIL_FROM, verified sender domain, and Resend dashboard logs.",
          },
        },
        { status: 502 }
      );
    }

    // Insert real-time notification
    await supabaseAdmin.from("admin_notifications").insert({
      admin_id: authUserId,
      type: "admin",
      title: "Administrator Access Granted",
      message: `You have been appointed as ${resolvedRole.replaceAll("_", " ")} on UGC FY Admin Panel.`,
      href: "/admin/dashboard",
      metadata: {
        role: resolvedRole,
        provisioned_by: check.admin.id,
      },
    });

    // Write audit log
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: "admin.provisioned",
      targetType: "admin",
      targetId: authUserId,
      metadata: { email: normalizedEmail, role: resolvedRole },
    });

    // 10. If email succeeds, return positive response
    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      message: "Admin created successfully. Temporary credentials were emailed.",
      data: adminProfile,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);

    console.error("[POST /api/admin/admins]", normalizedError);

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
