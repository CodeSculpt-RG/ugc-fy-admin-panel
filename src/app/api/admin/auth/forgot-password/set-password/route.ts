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
    const { email: emailInput, resetToken, newPassword } = body;

    if (!emailInput || !resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT", message: "Missing required fields." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "WEAK_PASSWORD", message: "Password must be at least 8 characters long." },
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

    // We instantiate a client and set the session using the resetToken (which is the access_token from verifyOtp)
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${resetToken}`,
        },
      },
    });

    const { error: updateError } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.warn(`[Forgot Password] Failed password update for ${email}`);
      return NextResponse.json(
        { success: false, error: "UPDATE_FAILED", message: updateError.message || "Failed to set new password." },
        { status: 400 }
      );
    }

    // Success
    await logAdminSecurityEvent({
      adminUserId: adminRecord.id,
      email,
      ipAddress: ip,
      userAgent,
      eventType: "admin_password_changed",
      severity: "info",
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/admin/auth/forgot-password/set-password] Unexpected error:", message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Unexpected internal error" },
      { status: 500 }
    );
  }
}
