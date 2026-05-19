import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

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

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "https://adminpanel-nine-murex.vercel.app";

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

    // Find existing auth user by email
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    const existingAuthUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    let authUserId;

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
    } else {
      // Create new Supabase Auth user
      const tempPassword = crypto.randomUUID() + "A1!";
      const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        password: tempPassword,
        user_metadata: {
          full_name: normalizedFullName,
          admin_role: resolvedRole,
        },
      });

      if (createUserError) throw createUserError;
      authUserId = authData.user.id;
    }

    // Upsert admin profile (Step 3: unified single flow)
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
          last_invited_at: now,
          password_setup_sent_at: null,
          updated_at: now,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (profileError) throw profileError;

    // Send password setup email AFTER upsert succeeds
    let emailWarning: string | null = null;
    const setupRedirectUrl = `${appUrl}/admin/setup-password`;

    const { error: setupEmailError } = await supabaseAdmin.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: setupRedirectUrl,
      }
    );

    if (setupEmailError) {
      emailWarning = setupEmailError.message;
      const errorRecord = setupEmailError as unknown as Record<string, unknown>;
      console.error("[POST /api/admin/admins] Admin password setup email failed:", {
        message: setupEmailError.message,
        status: errorRecord.status ?? null,
        code: errorRecord.code ?? null,
        redirectTo: setupRedirectUrl,
      });
    }

    // Update profile after attempting email
    await supabaseAdmin
      .from("admin_profiles")
      .update({
        password_setup_sent_at: setupEmailError ? null : new Date().toISOString(),
        last_invited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUserId);

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
      message: setupEmailError
        ? "Admin was assigned, but password setup email failed to send."
        : "Admin assigned successfully. Password setup email has been sent.",
      warning: emailWarning,
      email: {
        attempted: true,
        redirectTo: setupRedirectUrl,
        error: setupEmailError
          ? {
              message: setupEmailError.message,
              code: (setupEmailError as unknown as Record<string, unknown>).code ?? null,
              status: (setupEmailError as unknown as Record<string, unknown>).status ?? null,
            }
          : null,
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
