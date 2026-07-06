import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/auth/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAdminSecurityEvent } from "@/lib/auth/admin-security";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";

export async function POST(request: Request) {
  try {
    const authResult = await verifyAdminAccess(request);
    if (!authResult.ok) {
      return NextResponse.json(
        { ok: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { admin } = authResult;
    const ip = getRequestIp(request);
    const userAgent = getUserAgent(request);

    const { error } = await supabaseAdmin
      .from("admin_users")
      .update({
        password_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id);

    if (error) {
      console.error("[POST /api/admin/auth/disable-password] DB error:", error);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR", message: error.message },
        { status: 500 }
      );
    }

    await logAdminSecurityEvent({
      adminUserId: admin.id,
      email: admin.email,
      ipAddress: ip,
      userAgent,
      eventType: "admin_password_disabled",
      severity: "info",
    });

    return NextResponse.json({ ok: true, success: true });
  } catch (error) {
    console.error("[POST /api/admin/auth/disable-password] error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Unexpected internal error" },
      { status: 500 }
    );
  }
}
