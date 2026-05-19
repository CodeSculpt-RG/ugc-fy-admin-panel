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
    const check = await requirePermission(request, "admin_management.write");
    if (!check.ok) return check.response;

    const body = await request.json();
    const { id, email, full_name, fullName, role, is_active } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, source: "real_supabase_database", error: { message: "Email is required." } },
        { status: 400 }
      );
    }

    const resolvedFullName = (full_name || fullName || email.split("@")[0]).trim();
    const resolvedRole = (role || "support_admin").toLowerCase().trim();

    const allowedRoles = [
      "owner",
      "super_admin",
      "moderation_admin",
      "finance_admin",
      "support_admin",
      "analyst",
    ];

    if (!allowedRoles.includes(resolvedRole)) {
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
    const { data: existingAdmin } = await supabaseAdmin
      .from("admin_profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        source: "real_supabase_database",
        data: existingAdmin,
        message: "Admin profile already exists in the system.",
      });
    }

    let userId = id;

    if (!userId) {
      try {
        const tempPassword = Math.random().toString(36).slice(-10) + "A1!@#";
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: tempPassword,
          user_metadata: {
            full_name: resolvedFullName,
            role: resolvedRole,
          },
        });

        if (authErr) {
          // If email already exists in Auth, handle with invite fallback
          if (authErr.code === "email_exists" || authErr.message?.includes("already been registered")) {
            console.log("[POST /api/admin/admins] Email already exists in authentication. Falling back to admin_invites.");

            const { data: invite, error: inviteError } = await supabaseAdmin
              .from("admin_invites")
              .upsert(
                {
                  email,
                  full_name: resolvedFullName,
                  role: resolvedRole,
                  invited_by: check.admin.id,
                  status: "pending",
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "email" }
              )
              .select("*")
              .single();

            if (inviteError) {
              throw inviteError;
            }

            void writeAuditLog({
              actorAdminId: check.admin.id,
              actorRole: check.admin.role,
              action: "admin.invite",
              targetType: "admin_invite",
              targetId: invite.id,
              metadata: { email, role: resolvedRole, fallback: "email_exists" },
            });

            return NextResponse.json({
              success: true,
              source: "real_supabase_database",
              data: invite,
              message: "User already exists in authentication. Admin invite has been created/updated for activation.",
            });
          }

          throw authErr;
        }

        if (authData?.user?.id) {
          userId = authData.user.id;
        } else {
          throw new Error("User creation returned no ID.");
        }
      } catch (authErr: unknown) {
        const normalizedAuthErr = normalizeError(authErr);
        console.error("[POST /api/admin/admins] Direct auth user creation failed:", normalizedAuthErr);
        return NextResponse.json(
          { success: false, source: "real_supabase_database", error: normalizedAuthErr },
          { status: 500 }
        );
      }
    }

    // Insert into admin_profiles since auth user exists and profile was missing
    const { data: newAdmin, error } = await supabaseAdmin
      .from("admin_profiles")
      .insert({
        id: userId,
        email,
        full_name: resolvedFullName,
        role: resolvedRole,
        is_active: is_active ?? true,
        invited_by: check.admin.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: "admin.provision",
      targetType: "admin_profile",
      targetId: userId,
      metadata: { email, role: resolvedRole },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: newAdmin,
      message: "Administrator successfully provisioned.",
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
