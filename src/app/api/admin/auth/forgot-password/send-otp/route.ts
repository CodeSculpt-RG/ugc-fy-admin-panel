import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/auth/admin-types";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";
import { logAdminSecurityEvent } from "@/lib/auth/admin-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const ip = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    const body = await request.json().catch(() => ({}));
    const emailInput = body.email;

    if (!emailInput || typeof emailInput !== "string") {
      return NextResponse.json(
        { success: false, error: "INVALID_EMAIL", message: "Email is required." },
        { status: 400 }
      );
    }

    const email = normalizeEmail(emailInput);

    // Verify admin user exists in admin_users ledger
    const { data: adminRecord, error: fetchErr } = await supabaseAdmin
      .from("admin_users")
      .select("id, email, status")
      .eq("email", email)
      .maybeSingle();

    if (fetchErr || !adminRecord) {
      console.warn(`[Forgot Password] Rejected OTP request for uninvited email: ${email}`);
      await logAdminSecurityEvent({
        email,
        ipAddress: ip,
        userAgent,
        eventType: "admin_password_reset_rejected",
        severity: "warning",
        metadata: { reason: "NOT_INVITED" },
      });
      // Safe generic message
      return NextResponse.json({ success: true, message: "If this admin email is approved, an OTP has been sent." });
    }

    if (adminRecord.status === "suspended" || adminRecord.status === "revoked") {
      await logAdminSecurityEvent({
        adminUserId: adminRecord.id,
        email,
        ipAddress: ip,
        userAgent,
        eventType: "admin_password_reset_rejected",
        severity: "critical",
        metadata: { reason: adminRecord.status.toUpperCase() },
      });
      return NextResponse.json({ success: true, message: "If this admin email is approved, an OTP has been sent." });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: "CONFIG_ERROR", message: "Forgot password system is not configured." },
        { status: 500 }
      );
    }

    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: resetError } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (resetError) {
      console.error("[Forgot Password] Supabase reset password error:", resetError);
      return NextResponse.json(
        { success: false, error: "OTP_FAILED", message: resetError.message || "Failed to trigger OTP." },
        { status: resetError.status || 500 }
      );
    }

    await logAdminSecurityEvent({
      adminUserId: adminRecord.id,
      email,
      ipAddress: ip,
      userAgent,
      eventType: "admin_password_reset_requested",
      severity: "info",
    });

    return NextResponse.json({ success: true, message: "If this admin email is approved, an OTP has been sent." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/admin/auth/forgot-password/send-otp] Unexpected error:", message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Unexpected internal error" },
      { status: 500 }
    );
  }
}
