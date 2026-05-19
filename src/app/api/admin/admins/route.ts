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

    const emailResult = await resend.emails.send({
      from: process.env.ADMIN_EMAIL_FROM || "UGC FY Admin <onboarding@resend.dev>",
      to: normalizedEmail,
      subject: "UGC FY Admin Access Credentials",
      html: `
        <div style="font-family:Arial,sans-serif;background:#f3f5f9;padding:40px;">
          <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e6e9ef;">
            <div style="padding:28px 32px;background:linear-gradient(135deg,#040720,#111a45);color:#fff;">
              <h2 style="margin:0;">UGC FY</h2>
              <p style="margin:6px 0 0;">Admin Access Credentials</p>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#111827;">You’ve been assigned admin access</h2>
              <p style="color:#5f6b7a;line-height:1.6;">Hello <strong>${normalizedFullName}</strong>,</p>
              <p style="color:#5f6b7a;line-height:1.6;">You have been appointed as an administrator for the UGC FY Admin Panel.</p>

              <div style="background:#f8fafc;border:1px solid #edf1f6;border-radius:14px;padding:18px;margin:24px 0;">
                <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                <p><strong>Email:</strong> ${normalizedEmail}</p>
                <p><strong>Temporary Password:</strong> <code style="font-size:16px;background:#fff3e8;padding:6px 10px;border-radius:8px;">${temporaryPassword}</code></p>
                <p><strong>Assigned Role:</strong> ${resolvedRole.replaceAll("_", " ")}</p>
              </div>

              <p style="color:#b45309;font-weight:700;">For security, you must change this password immediately after first login.</p>

              <a href="${loginUrl}" style="display:inline-block;margin-top:16px;padding:14px 22px;background:#2563eb;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;">
                Login to Admin Panel
              </a>
            </div>
          </div>
        </div>
      `,
    });

    // 9. If email fails, return warning clearly
    if (emailResult.error) {
      return NextResponse.json(
        {
          success: false,
          source: "email_delivery",
          error: {
            message: "Admin was created, but credential email failed to send.",
            code: "EMAIL_SEND_FAILED",
            details: emailResult.error.message,
            hint: "Check RESEND_API_KEY, sender domain, and Resend dashboard logs.",
          },
        },
        { status: 500 }
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
    console.error("[POST /api/admin/admins] Failed to provision admin:", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
