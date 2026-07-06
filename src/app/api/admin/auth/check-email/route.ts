import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";
import {
  normalizeEmail,
  isOwnerEmail,
  isOwnerDevFallbackEnabled,
  isAdminUsersMissingError,
  OWNER_EMAIL,
} from "@/lib/auth/admin-types";
import {
  isEmailOrIpBanned,
  applyAbusePolicy,
  logAdminSecurityEvent,
} from "@/lib/auth/admin-security";



export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = body.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json(
        { allowed: false, reason: "INVALID_EMAIL", message: "Email is required." },
        { status: 400 }
      );
    }

    const email = normalizeEmail(rawEmail);
    const ip = getRequestIp(request);
    const userAgent = getUserAgent(request);

    // 1. Check for Active Email/IP Ban (Bypassed for Owner)
    const banCheck = await isEmailOrIpBanned(email, ip);
    if (banCheck.banned && !isOwnerEmail(email)) {
      return NextResponse.json(
        { allowed: false, reason: "BANNED", message: banCheck.reason },
        { status: 403 }
      );
    }

    // 2. Emergency self-healing for owner email
    if (isOwnerEmail(email)) {
      let ownerUpsertFailure: unknown = null;

      try {
        const { data: ownerRow, error: ownerUpsertError } = await supabaseAdmin
          .from("admin_users")
          .upsert(
            {
              email: OWNER_EMAIL,
              full_name: "UGC FY Owner",
              role: "owner",
              status: "active",
              password_enabled: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "email",
            }
          )
          .select("id,email,role,status,password_enabled")
          .maybeSingle();

        if (!ownerUpsertError && ownerRow) {
          return NextResponse.json({
            allowed: true,
            email: ownerRow.email,
            status: ownerRow.status,
            methods: {
              google: true,
              otp: true,
              password: Boolean(ownerRow.password_enabled),
            },
          });
        } else if (ownerUpsertError) {
          ownerUpsertFailure = ownerUpsertError;
          console.warn("[check-email] Owner upsert database warning:", ownerUpsertError.message);
        }
      } catch (dbErr) {
        ownerUpsertFailure = dbErr;
        console.error("[check-email] Failed to self-heal owner row in database:", dbErr);
      }

      const isMissingAdminUsers = isAdminUsersMissingError(ownerUpsertFailure);

      // Hardcoded fallback: only when admin_users is missing and explicit dev fallback is enabled.
      if (isMissingAdminUsers && isOwnerDevFallbackEnabled()) {
        console.warn("[check-email] DEV FALLBACK: owner allowed without database row. Disabled in production.");
        return NextResponse.json({
          allowed: true,
          email: OWNER_EMAIL,
          status: "active",
          methods: {
            google: true,
            otp: true,
            password: false,
          },
          devFallback: true,
        });
      }

      console.error("[check-email] CRITICAL: Owner row could not be verified in admin_users. Run the SQL migration.");
      return NextResponse.json(
        {
          allowed: false,
          reason: "CONFIG_ERROR",
          message: "Admin authorization database is not configured.",
        },
        { status: 500 }
      );
    }

    // 3. Query admin_users for normal emails
    const { data: adminRecord, error: adminErr } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .single();

    if (adminErr || !adminRecord) {
      // Log event
      await logAdminSecurityEvent({
        email,
        ipAddress: ip,
        userAgent,
        eventType: "admin_email_check_rejected_uninvited",
        severity: "warning",
      });

      // Apply abuse/rate-limit policy
      await applyAbusePolicy(email, ip);

      return NextResponse.json(
        { allowed: false, reason: "NOT_INVITED" },
        { status: 403 }
      );
    }

    // 4. Status checks
    if (adminRecord.status === "suspended") {
      await logAdminSecurityEvent({
        adminUserId: adminRecord.id,
        email,
        ipAddress: ip,
        userAgent,
        eventType: "admin_login_failed_suspended",
        severity: "critical",
      });
      return NextResponse.json(
        { allowed: false, reason: "SUSPENDED" },
        { status: 403 }
      );
    }

    if (adminRecord.status === "revoked") {
      await logAdminSecurityEvent({
        adminUserId: adminRecord.id,
        email,
        ipAddress: ip,
        userAgent,
        eventType: "admin_login_failed_revoked",
        severity: "critical",
      });
      return NextResponse.json(
        { allowed: false, reason: "REVOKED" },
        { status: 403 }
      );
    }

    // 5. Allowed check log
    await logAdminSecurityEvent({
      adminUserId: adminRecord.id,
      email,
      ipAddress: ip,
      userAgent,
      eventType: "admin_email_check_allowed",
      severity: "info",
    });

    return NextResponse.json({
      allowed: true,
      email,
      status: adminRecord.status,
      methods: {
        google: true,
        otp: true,
        password: adminRecord.password_enabled === true,
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/auth/check-email] Unexpected error:", error);
    return NextResponse.json(
      { allowed: false, reason: "GENERIC_ERROR", message: "Unexpected internal check error" },
      { status: 500 }
    );
  }
}
