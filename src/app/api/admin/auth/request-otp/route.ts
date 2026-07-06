import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";
import { normalizeEmail } from "@/lib/auth/admin-types";
import {
  applyAbusePolicy,
  isEmailOrIpBanned,
  logAdminSecurityEvent,
} from "@/lib/auth/admin-security";

type RequestOtpBody = {
  email?: unknown;
  next?: unknown;
};

type AdminUserRow = {
  id: string;
  email: string;
  status: "invited" | "active" | "suspended" | "revoked";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(error: string, message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
    },
    { status }
  );
}

function getSafeNext(next: unknown): string {
  if (
    typeof next === "string" &&
    next.startsWith("/admin") &&
    !next.startsWith("//") &&
    !next.includes("://") &&
    !next.toLowerCase().includes("javascript:")
  ) {
    return next;
  }

  return "/admin/dashboard";
}

function isUserAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as { status?: unknown; code?: unknown; message?: unknown };
  const status = typeof err.status === "number" ? err.status : null;
  const code = typeof err.code === "string" ? err.code.toLowerCase() : "";
  const message = typeof err.message === "string" ? err.message.toLowerCase() : "";

  return (
    status === 422 ||
    code.includes("user_already_exists") ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    const body = (await request.json().catch(() => ({}))) as RequestOtpBody;

    if (typeof body.email !== "string") {
      return jsonError("INVALID_EMAIL", "A valid admin email is required.", 400);
    }

    const normalizedEmail = normalizeEmail(body.email);
    if (!EMAIL_RE.test(normalizedEmail)) {
      return jsonError("INVALID_EMAIL", "A valid admin email is required.", 400);
    }

    const banCheck = await isEmailOrIpBanned(normalizedEmail, ip);
    if (banCheck.banned) {
      await logAdminSecurityEvent({
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        eventType: "admin_otp_rejected",
        severity: "critical",
        metadata: { reason: "BANNED" },
      });

      return jsonError(
        "BANNED",
        "Access temporarily blocked due to suspicious activity.",
        403
      );
    }

    const { data: adminUser, error: adminUserError } = await supabaseAdmin
      .from("admin_users")
      .select("id,email,status")
      .eq("email", normalizedEmail)
      .maybeSingle<AdminUserRow>();

    if (adminUserError) {
      console.error("[request-otp] Failed to read admin_users:", adminUserError);
      return jsonError(
        "CONFIG_ERROR",
        "Admin OTP system is not configured correctly.",
        500
      );
    }

    if (!adminUser) {
      await logAdminSecurityEvent({
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        eventType: "admin_otp_rejected",
        severity: "warning",
        metadata: { reason: "NOT_INVITED" },
      });
      await applyAbusePolicy(normalizedEmail, ip);

      return jsonError(
        "NOT_INVITED",
        "This email does not have admin access.",
        403
      );
    }

    if (adminUser.status === "suspended" || adminUser.status === "revoked") {
      await logAdminSecurityEvent({
        adminUserId: adminUser.id,
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        eventType: "admin_otp_rejected",
        severity: "critical",
        metadata: { reason: adminUser.status.toUpperCase() },
      });

      return jsonError(
        adminUser.status.toUpperCase(),
        "This admin account cannot request OTP access.",
        403
      );
    }

    if (adminUser.status !== "active" && adminUser.status !== "invited") {
      await logAdminSecurityEvent({
        adminUserId: adminUser.id,
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        eventType: "admin_otp_rejected",
        severity: "warning",
        metadata: { reason: "INVALID_STATUS", status: adminUser.status },
      });

      return jsonError(
        "NOT_INVITED",
        "This email does not have admin access.",
        403
      );
    }

    const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
    });

    if (createUserError && !isUserAlreadyExistsError(createUserError)) {
      console.error("[request-otp] Failed to create approved admin auth user:", createUserError);
      return jsonError(
        "CONFIG_ERROR",
        "Admin OTP system is not configured correctly.",
        500
      );
    }

    if (!createUserError) {
      await logAdminSecurityEvent({
        adminUserId: adminUser.id,
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        eventType: "admin_auth_user_created_for_invited_admin",
        severity: "info",
      });
    }

    const requestUrl = new URL(request.url);
    const safeNext = getSafeNext(body.next);
    const redirectUrl = new URL("/admin/auth/callback", requestUrl.origin);
    redirectUrl.searchParams.set("next", safeNext);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return jsonError(
        "CONFIG_ERROR",
        "Admin OTP system is not configured correctly.",
        500
      );
    }

    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: otpError } = await supabaseAnon.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectUrl.toString(),
      },
    });

    if (otpError) {
      console.error("Admin OTP send failed:", {
        email: normalizedEmail,
        code: otpError.code,
        message: otpError.message,
      });

      const rateLimitMsg =
        otpError.status === 429 || otpError.code === "over_email_send_rate_limit"
          ? otpError.message || "Please wait a moment before requesting another OTP."
          : "Unable to send OTP. Please use password login or try again.";

      return jsonError(
        "OTP_SEND_FAILED",
        rateLimitMsg,
        otpError.status || 500
      );
    }

    await logAdminSecurityEvent({
      adminUserId: adminUser.id,
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      eventType: "admin_otp_requested",
      severity: "info",
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent to approved admin email.",
    });
  } catch (error) {
    console.error("[POST /api/admin/auth/request-otp] Unexpected error:", error);
    return jsonError(
      "OTP_SEND_FAILED",
      "Unable to complete OTP request. Please use password login or try again.",
      500
    );
  }
}
