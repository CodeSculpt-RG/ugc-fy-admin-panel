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
    const { email, full_name, fullName, role, is_active } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, source: "real_supabase_database", error: { message: "Email is required." } },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const normalizedEmail = email.trim().toLowerCase();
    const resolvedFullName = (full_name || fullName || email.split("@")[0]).trim();
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

    // Check if admin profile already exists
    const { data: existingAdminProfile } = await supabaseAdmin
      .from("admin_profiles")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingAdminProfile) {
      // 1. Promote/update existing admin profile
      const { data: updatedAdmin, error: updateError } = await supabaseAdmin
        .from("admin_profiles")
        .update({
          full_name: resolvedFullName,
          role: resolvedRole,
          is_active: is_active ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAdminProfile.id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      // 2. Trigger password reset/setup email
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${appUrl}/admin/setup-password`,
        }
      );

      if (resetError) {
        console.error("[POST /api/admin/admins] Password setup email failed:", {
          message: resetError.message,
        });
      } else {
        await supabaseAdmin
          .from("admin_profiles")
          .update({
            password_setup_sent_at: new Date().toISOString(),
            last_invited_at: new Date().toISOString(),
          })
          .eq("id", existingAdminProfile.id);
      }

      // 3. Create real-time notification
      await supabaseAdmin.from("admin_notifications").insert({
        admin_id: existingAdminProfile.id,
        type: "admin",
        title: "Administrator Access Granted",
        message: `You have been provisioned as ${resolvedRole.replace("_", " ")} on UGC FY Admin Panel.`,
        href: "/admin/dashboard",
        metadata: {
          role: resolvedRole,
          provisioned_by: check.admin.id,
        },
      });

      // 4. Write audit log
      void writeAuditLog({
        actorAdminId: check.admin.id,
        actorRole: check.admin.role,
        action: "admin.provisioned",
        targetType: "admin",
        targetId: existingAdminProfile.id,
        metadata: { email: normalizedEmail, role: resolvedRole, action_type: "update" },
      });

      return NextResponse.json({
        success: true,
        source: "real_supabase_database",
        data: updatedAdmin,
        message: "Admin access provisioned successfully. Password setup email has been sent.",
        warning: resetError ? "Admin was provisioned, but password setup email failed to send." : null,
      });
    }

    // Find existing auth user by email
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    const existingAuthUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    let adminProfile;
    let authUserId;

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;

      // Promote existing auth user in admin_profiles
      const { data: upsertedProfile, error: profileError } = await supabaseAdmin
        .from("admin_profiles")
        .upsert(
          {
            id: authUserId,
            email: normalizedEmail,
            full_name: resolvedFullName,
            role: resolvedRole,
            is_active: is_active ?? true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("*")
        .single();

      if (profileError) throw profileError;
      adminProfile = upsertedProfile;
    } else {
      // Create new Supabase Auth user
      const tempPassword = crypto.randomUUID() + "A1!";
      const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        password: tempPassword,
        user_metadata: {
          full_name: resolvedFullName,
          admin_role: resolvedRole,
        },
      });

      if (createUserError) throw createUserError;
      authUserId = authData.user.id;

      // Insert new entry in admin_profiles
      const { data: insertedProfile, error: profileError } = await supabaseAdmin
        .from("admin_profiles")
        .insert({
          id: authUserId,
          email: normalizedEmail,
          full_name: resolvedFullName,
          role: resolvedRole,
          is_active: is_active ?? true,
          invited_by: check.admin.id,
        })
        .select("*")
        .single();

      if (profileError) throw profileError;
      adminProfile = insertedProfile;
    }

    // Trigger password reset/setup email
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${appUrl}/admin/setup-password`,
      }
    );

    if (resetError) {
      console.error("[POST /api/admin/admins] Password setup email failed:", {
        message: resetError.message,
      });
    } else {
      await supabaseAdmin
        .from("admin_profiles")
        .update({
          password_setup_sent_at: new Date().toISOString(),
          last_invited_at: new Date().toISOString(),
        })
        .eq("id", authUserId);
    }

    // Create real-time notification
    await supabaseAdmin.from("admin_notifications").insert({
      admin_id: authUserId,
      type: "admin",
      title: "Administrator Access Granted",
      message: `You have been provisioned as ${resolvedRole.replace("_", " ")} on UGC FY Admin Panel.`,
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
      metadata: { email: normalizedEmail, role: resolvedRole, action_type: "create" },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: adminProfile,
      message: "Admin access provisioned successfully. Password setup email has been sent.",
      warning: resetError ? "Admin was provisioned, but password setup email failed to send." : null,
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
