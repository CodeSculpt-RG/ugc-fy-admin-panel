import { NextResponse } from "next/server";
import { requireOwner, normalizeEmail } from "@/lib/auth/admin-auth";
import { isOwnerEmail } from "@/lib/auth/admin-types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAdminSecurityEvent } from "@/lib/auth/admin-security";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";

type InviteRequestBody = {
  email?: string;
  full_name?: string;
  role?: string;
};

export async function GET(request: Request) {
  try {
    await requireOwner(request);

    const { data: admins, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/invites] DB error:", error);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, success: true, data: admins ?? [] });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Owner authorization required.";
    console.error("[GET /api/admin/invites] authorization error:", errMsg);
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: errMsg },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request);
    const ip = getRequestIp(request);
    const userAgent = getUserAgent(request);

    const body = (await request.json().catch(() => ({}))) as InviteRequestBody;
    const { email, full_name, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", message: "Email and Access Vector (role) are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const resolvedRole = role.toLowerCase().trim();

    // 1. Safeguard: Block creating another owner
    if (resolvedRole === "owner") {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN", message: "Security Protocol Violation: Only one owner account is permitted." },
        { status: 400 }
      );
    }

    // 2. Safeguard: Block inviting the owner email via manual invites
    if (isOwnerEmail(normalizedEmail)) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN", message: "Security Protocol Violation: The owner account cannot be re-invited." },
        { status: 400 }
      );
    }

    // 2. Validate role is in allowed set
    const allowedRoles = [
      "super_admin",
      "admin",
      "kyc_manager",
      "campaign_manager",
      "moderator",
      "support",
      "finance",
    ];

    if (!allowedRoles.includes(resolvedRole)) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", message: `Invalid Access Vector. Must be one of: ${allowedRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // 3. Upsert admin invite row
    const { data: invitedUser, error: dbErr } = await supabaseAdmin
      .from("admin_users")
      .upsert(
        {
          email: normalizedEmail,
          full_name: full_name || null,
          role: resolvedRole,
          status: "invited",
          invited_by: owner.id,
          invited_at: new Date().toISOString(),
          password_enabled: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (dbErr || !invitedUser) {
      console.error("[POST /api/admin/invites] DB error:", dbErr);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR", message: dbErr?.message || "Failed to upsert invite." },
        { status: 500 }
      );
    }

    // 4. Log event
    await logAdminSecurityEvent({
      adminUserId: owner.id,
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      eventType: "admin_invite_created",
      severity: "info",
      metadata: { invitedAdminUserId: invitedUser.id, role: resolvedRole },
    });

    return NextResponse.json({ ok: true, success: true, data: invitedUser });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Access Denied: Owner authorization required.";
    console.error("[POST /api/admin/invites] authorization error:", errMsg);
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: errMsg },
      { status: 403 }
    );
  }
}
