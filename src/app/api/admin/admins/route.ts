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
    const resolvedFullName = full_name || fullName || email.split("@")[0];
    const resolvedRole = (role || "support_admin").toLowerCase();

    // OWNER protection: only owner can create another owner
    if (resolvedRole === "owner" && check.admin.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Only platform owners can provision new owners." },
        { status: 403 }
      );
    }

    let userId = id;
    let message = "Administrator provisioned successfully.";

    if (!userId) {
      try {
        const tempPassword = Math.random().toString(36).slice(-10) + "A1!@#";
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: tempPassword,
          user_metadata: { full_name: resolvedFullName, role: resolvedRole },
        });

        if (authErr) {
          throw authErr;
        }

        if (authData?.user?.id) {
          userId = authData.user.id;
        } else {
          throw new Error("User creation returned no ID.");
        }
      } catch (authErr: unknown) {
        console.warn("[POST /api/admin/admins] Direct auth user creation failed or restricted, creating invite.", authErr);
        message = "Admin invite created successfully.";

        const { data: inviteData, error: inviteErr } = await supabaseAdmin
          .from("admin_invites")
          .insert({
            email,
            role: resolvedRole.toUpperCase(),
            invited_by: check.admin.id,
            status: "Pending",
          })
          .select()
          .single();

        if (inviteErr) throw inviteErr;

        void writeAuditLog({
          actorAdminId: check.admin.id,
          actorRole: check.admin.role,
          action: `admin.invite`,
          targetType: "admin_invite",
          targetId: inviteData.id,
          metadata: { email, role: resolvedRole },
        });

        return NextResponse.json({
          success: true,
          isInvite: true,
          message,
          data: inviteData,
        });
      }
    }

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
      action: `admin.provision`,
      targetType: "admin_profile",
      targetId: userId,
      metadata: { email, role: resolvedRole },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      message,
      data: newAdmin,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[POST /api/admin/admins]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
