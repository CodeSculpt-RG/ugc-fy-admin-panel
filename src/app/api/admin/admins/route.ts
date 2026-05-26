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
    // 1. Require admin_management.write permission
    const check = await requirePermission(request, "admin_management.write");
    if (!check.ok) return check.response;

    const body = await request.json();
    const { email, full_name, fullName, role } = body;

    // 2. Validate email, full_name, role
    if (!email || (!full_name && !fullName)) {
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

    // 3. Find auth user by email
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    const existingAuthUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    let authUserId;

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
      // 4. If user exists, update user_metadata
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          full_name: normalizedFullName,
          admin_role: resolvedRole,
        },
      });
      if (updateAuthError) throw updateAuthError;
    } else {
      // 5. If user does not exist, create user
      const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: {
          full_name: normalizedFullName,
          admin_role: resolvedRole,
        },
      });

      if (createUserError) throw createUserError;
      authUserId = authData.user.id;
    }

    // 6. Upsert admin_profiles with setup timestamps
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
          password_setup_sent_at: now,
          last_invited_at: now,
          updated_at: now,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (profileError) throw profileError;

    // 7. Trigger Supabase resetPasswordForEmail setup email
    const setupRedirectUrl = "https://adminpanel-nine-murex.vercel.app/admin/setup-password";

    const { error: setupEmailError } = await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: setupRedirectUrl,
    });

    if (setupEmailError) {
      throw new Error(setupEmailError.message);
    }

    // 8. Insert real-time notification
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

    // 9. Write audit log
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: "admin.provisioned",
      targetType: "admin",
      targetId: authUserId,
      metadata: { email: normalizedEmail, role: resolvedRole },
    });

    // 10. Return success message
    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      message: "Admin access created successfully. Password setup email has been sent.",
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
