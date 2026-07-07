import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/auth/admin-types";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";
import { logAdminSecurityEvent } from "@/lib/auth/admin-security";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const ip = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    const body = await request.json().catch(() => ({}));
    const { email: emailInput, token } = body;

    if (!emailInput || !token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT", message: "Email and OTP token are required." },
        { status: 400 }
      );
    }

    const email = normalizeEmail(emailInput);

    const { data: adminRecord, error: fetchErr } = await supabaseAdmin
      .from("admin_users")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (fetchErr || !adminRecord || adminRecord.status !== "active") {
      return NextResponse.json(
        { success: false, error: "INVALID_ADMIN", message: "Invalid admin account state." },
        { status: 400 }
      );
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

    // Verify OTP using Supabase Auth
    const { data, error: verifyError } = await supabaseAnon.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (verifyError || !data.session) {
      console.warn(`[Forgot Password] Failed OTP verification for ${email}`);
      await logAdminSecurityEvent({
        adminUserId: adminRecord.id,
        email,
        ipAddress: ip,
        userAgent,
        eventType: "admin_login_failed",
        severity: "warning",
        metadata: { reason: "INVALID_OTP", error: verifyError?.message },
      });

      return NextResponse.json(
        { success: false, error: "INVALID_OTP", message: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    // Success - we return the session token to the client so they can call set-password
    return NextResponse.json({
      success: true,
      message: "OTP verified successfully.",
      resetToken: data.session.access_token,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/admin/auth/forgot-password/verify-otp] Unexpected error:", message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Unexpected internal error" },
      { status: 500 }
    );
  }
}
