import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { writeAuditLog } from "@/lib/api/writeAuditLog";
import { normalizeError } from "@/lib/api/normalizeError";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const check = await requirePermission(request, "admin_management.write");
    if (!check.ok) return check.response;

    const body = await request.json();
    const { email, full_name, role } = body;

    if (!email || !full_name) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Email and Full Name are required." } },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const resolvedRole = (role || "support_admin").toLowerCase().trim();

    if ((resolvedRole === "owner" || resolvedRole === "super_admin") && check.admin.role !== "owner") {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Access Denied: Only active platform owners can provision highly privileged roles." } },
        { status: 403 }
      );
    }

    // 1. Check existing admin_profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("admin_profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { ok: false, error: { code: "ADMIN_ALREADY_EXISTS", message: "This email is already associated with an admin profile." } },
        { status: 409 }
      );
    }

    // 2. Find auth user by email
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    const existingAuthUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    if (!existingAuthUser) {
      return NextResponse.json(
        { ok: false, error: { code: "AUTH_USER_NOT_FOUND", message: "No existing Supabase Auth user found for this email." } },
        { status: 404 }
      );
    }

    // 3. Link existing user by creating admin_profile
    const now = new Date().toISOString();
    const { error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .upsert({
        id: existingAuthUser.id,
        email: normalizedEmail,
        full_name: full_name.trim(),
        role: resolvedRole,
        is_active: true,
        invite_status: "pending",
        must_change_password: true,
        invited_by_admin_id: check.admin.id,
        invited_at: now,
        updated_at: now,
      }, { onConflict: "id" });

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
      targetId: existingAuthUser.id,
      metadata: { email: normalizedEmail, role: resolvedRole },
    });

    // Optionally send password recovery email if the user is already confirmed
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = `${appUrl}/admin/auth/callback?next=/admin/force-password-change`;

    // Try to invite/recover. If user exists, inviteUserByEmail fails, so we use resetPasswordForEmail
    const { error: resetError } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo,
      data: {
        admin_role: resolvedRole,
        role: "admin",
      },
    });

    if (resetError && resetError.message.toLowerCase().includes("already been registered")) {
      // It's an existing user, try sending a password reset instead
      await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      message: "Admin profile linked successfully.",
      admin: {
        id: existingAuthUser.id,
        email: normalizedEmail,
        role: resolvedRole,
      }
    });

  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[POST /api/admin/admins/link-existing]", normalizedError);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: normalizedError.message } },
      { status: 500 }
    );
  }
}
