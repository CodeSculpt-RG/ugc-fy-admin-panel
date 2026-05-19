import { NextResponse } from "next/server";
import crypto from "crypto";
import tls from "tls";
import net from "net";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

function generateTemporaryPassword(): string {
  return `${crypto.randomBytes(12).toString("base64url")}A1!`;
}

function sendSMTPEmail(options: {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const isSecure = options.port === 465;
    const socket = isSecure
      ? tls.connect({ host: options.host, port: options.port, rejectUnauthorized: false })
      : net.createConnection({ host: options.host, port: options.port });

    let step = 0;
    const send = (data: string) => {
      socket.write(data + "\r\n");
    };

    socket.on("data", () => {
      
      if (step === 0) {
        send(`EHLO localhost`);
        step++;
      } else if (step === 1) {
        if (options.user && options.pass) {
          send(`AUTH LOGIN`);
          step++;
        } else {
          send(`MAIL FROM:<${options.from}>`);
          step = 4;
        }
      } else if (step === 2) {
        send(Buffer.from(options.user || "").toString("base64"));
        step++;
      } else if (step === 3) {
        send(Buffer.from(options.pass || "").toString("base64"));
        step++;
      } else if (step === 4) {
        send(`RCPT TO:<${options.to}>`);
        step++;
      } else if (step === 5) {
        send(`DATA`);
        step++;
      } else if (step === 6) {
        const emailContent = [
          `From: ${options.from}`,
          `To: ${options.to}`,
          `Subject: ${options.subject}`,
          `Content-Type: text/html; charset=utf-8`,
          `MIME-Version: 1.0`,
          ``,
          options.html,
          `.`
        ].join("\r\n");
        send(emailContent);
        step++;
      } else if (step === 7) {
        send(`QUIT`);
        socket.end();
        resolve();
      }
    });

    socket.on("error", (err) => {
      reject(err);
    });
  });
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
    const check = await requirePermission(request, "admin_management.write");
    if (!check.ok) return check.response;

    const body = await request.json();
    const { email, full_name, fullName, role } = body;

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

    // Generate strong temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Find existing auth user by email
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    const existingAuthUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    let authUserId;

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
      // Update their password and set must_change_password metadata
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
      // Create new user with temporary password and metadata
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

    // Upsert admin profile
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

    // Send credentials email
    let emailWarning: string | null = null;
    let emailSent = false;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `UGC FY <no-reply@adminpanel-nine-murex.vercel.app>`;

    const emailHtml = `
      <h2>You’ve been assigned admin access to UGC FY</h2>
      <p>Hello ${normalizedFullName},</p>
      <p>You have been appointed as an administrator for the UGC FY Admin Panel.</p>
      <p><strong>Login URL:</strong> https://adminpanel-nine-murex.vercel.app/admin/login</p>
      <p><strong>Email:</strong> ${normalizedEmail}</p>
      <p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
      <p><strong>Assigned Role:</strong> ${resolvedRole.replaceAll("_", " ")}</p>
      <p>You will be required to change this password immediately after your first login.</p>
    `;

    if (smtpHost) {
      try {
        await sendSMTPEmail({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom,
          to: normalizedEmail,
          subject: "UGC FY Admin Access Credentials",
          html: emailHtml,
        });
        emailSent = true;
      } catch (err: unknown) {
        const errorRecord = err as Record<string, unknown>;
        emailWarning = String(errorRecord.message || "Failed to deliver SMTP mail socket conversation.");
        console.error("[SMTP EMAIL ERROR]", err);
      }
    } else {
      console.log("[ADMIN CREATED WITH TEMP CREDENTIALS]", {
        email: normalizedEmail,
        temporaryPassword,
        role: resolvedRole,
      });
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

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: adminProfile,
      message: emailWarning
        ? "Admin was provisioned, but SMTP email delivery failed."
        : "Admin assigned successfully. Temporary credentials have been generated and emailed.",
      warning: emailWarning,
      temp_credentials: {
        email: normalizedEmail,
        temporaryPassword,
        role: resolvedRole,
      },
      email: {
        attempted: true,
        sent: emailSent,
        error: emailWarning,
      },
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
