import { NextResponse } from "next/server";
import { requireOwner, normalizeEmail } from "@/lib/auth/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAdminSecurityEvent } from "@/lib/auth/admin-security";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";

type UnbanRequestBody = {
  banId?: string;
  ban_type?: string;
  value?: string;
};

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request);
    const ip = getRequestIp(request);
    const userAgent = getUserAgent(request);

    const body = (await request.json().catch(() => ({}))) as UnbanRequestBody;
    const { banId, ban_type, value } = body;

    let deleteQuery = supabaseAdmin.from("admin_bans").delete();
    let targetDetail = "";

    if (banId) {
      deleteQuery = deleteQuery.eq("id", banId);
      targetDetail = `ID: ${banId}`;
    } else if (ban_type && value) {
      let val = value.trim();
      if (ban_type === "email") {
        val = normalizeEmail(val);
      }
      deleteQuery = deleteQuery.eq("ban_type", ban_type).eq("value", val);
      targetDetail = `${ban_type}: ${val}`;
    } else {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", message: "Either banId or (ban_type and value) must be provided." },
        { status: 400 }
      );
    }

    const { error } = await deleteQuery;

    if (error) {
      console.error("[POST /api/admin/security/unban] DB error:", error);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR", message: error.message },
        { status: 500 }
      );
    }

    await logAdminSecurityEvent({
      adminUserId: owner.id,
      ipAddress: ip,
      userAgent,
      eventType: "admin_unbanned",
      severity: "info",
      metadata: { target: targetDetail },
    });

    return NextResponse.json({ ok: true, success: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Access Denied: Owner authorization required.";
    console.error("[POST /api/admin/security/unban] authorization error:", errMsg);
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: errMsg },
      { status: 403 }
    );
  }
}
