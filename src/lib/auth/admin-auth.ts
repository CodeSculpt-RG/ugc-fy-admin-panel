import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminSecurityEvent, isEmailOrIpBanned } from "./admin-security";
import {
  AdminUser,
  AdminRole,
  normalizeEmail,
  isOwnerEmail,
  isOwnerDevFallbackEnabled,
  isAdminUsersMissingError,
  OWNER_EMAIL,
} from "./admin-types";
export { normalizeEmail, isOwnerEmail, isOwnerDevFallbackEnabled, OWNER_EMAIL };

export function getRequestIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0].trim();
    return ip;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

export function getUserAgent(request: Request): string | null {
  return request.headers.get("user-agent");
}

export async function getCurrentSupabaseUser(request: Request) {
  let token: string | null = null;

  // Try Bearer token first
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "");
  }

  // Fall back to admin-token cookie
  if (!token) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;)\s*admin-token\s*=\s*([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) {
    return { ok: false, error: "SESSION_MISSING", status: 401 };
  }

  const supabase = createSupabaseServerClient(token);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { ok: false, error: "SESSION_EXPIRED", status: 401, message: error?.message };
  }

  return { ok: true, user, token };
}

export type VerifyAdminAccessResult =
  | { ok: true; admin: AdminUser }
  | { ok: false; error: string; status: number };

async function ensureOwnerAdminUser(): Promise<AdminUser> {
  const { data, error } = await supabaseAdmin
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
      { onConflict: "email" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    email: data.email,
    full_name: data.full_name,
    role: data.role as AdminRole,
    status: data.status,
    password_enabled: data.password_enabled,
  };
}

export async function verifyAdminAccess(request: Request): Promise<VerifyAdminAccessResult> {
  const ip = getRequestIp(request);
  const userAgent = getUserAgent(request);

  // 1. Get current Supabase user
  const authResult = await getCurrentSupabaseUser(request);
  if (!authResult.ok || !authResult.user) {
    return { ok: false, error: authResult.error || "UNAUTHORIZED", status: authResult.status || 401 };
  }

  const user = authResult.user;
  if (!user.email) {
    return { ok: false, error: "EMAIL_MISSING_ON_AUTH_USER", status: 400 };
  }

  const normalizedEmail = normalizeEmail(user.email);

  // 2. Check bans (Bypassed for Owner)
  const banCheck = await isEmailOrIpBanned(normalizedEmail, ip);
  if (banCheck.banned && !isOwnerEmail(normalizedEmail)) {
    await logAdminSecurityEvent({
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      eventType: "admin_email_check_rejected_banned",
      severity: "critical",
      metadata: { reason: banCheck.reason },
    });
    return { ok: false, error: "BANNED", status: 403 };
  }

  // 3. Find record in admin_users, self-healing the owner row when the table exists.
  let admin: AdminUser;

  if (isOwnerEmail(normalizedEmail)) {
    try {
      admin = await ensureOwnerAdminUser();
    } catch (dbErr) {
      console.error("[verifyAdminAccess] Failed to self-heal owner in admin_users:", dbErr);

      const isMissingAdminUsers = isAdminUsersMissingError(dbErr);

      if (isMissingAdminUsers && isOwnerDevFallbackEnabled()) {
        console.warn("[verifyAdminAccess] DEV FALLBACK: allowing owner without database. Disabled in production.");
        admin = {
          id: "00000000-0000-0000-0000-000000000000",
          user_id: user.id,
          email: OWNER_EMAIL,
          full_name: "UGC FY Owner",
          role: "owner",
          status: "active",
          password_enabled: false,
        };
      } else {
        console.error("[verifyAdminAccess] CRITICAL: admin_users is missing or owner row could not be verified. Run the SQL migration.");
        return { ok: false, error: "CONFIG_ERROR", status: 500 };
      }
    }
  } else {
    const { data: adminRecord, error: fetchErr } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (fetchErr || !adminRecord) {
      await logAdminSecurityEvent({
        email: normalizedEmail,
        ipAddress: ip,
        userAgent,
        eventType: "admin_login_failed_uninvited_email",
        severity: "warning",
        metadata: { details: fetchErr?.message },
      });
      return { ok: false, error: "NOT_INVITED", status: 403 };
    }

    admin = {
      id: adminRecord.id,
      user_id: adminRecord.user_id,
      email: adminRecord.email,
      full_name: adminRecord.full_name,
      role: adminRecord.role as AdminRole,
      status: adminRecord.status,
      password_enabled: adminRecord.password_enabled,
    };
  }

  // 4. Validate status constraints
  if (admin.status === "suspended") {
    await logAdminSecurityEvent({
      adminUserId: admin.id,
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      eventType: "admin_login_failed_suspended",
      severity: "critical",
    });
    return { ok: false, error: "SUSPENDED", status: 403 };
  }

  if (admin.status === "revoked") {
    await logAdminSecurityEvent({
      adminUserId: admin.id,
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      eventType: "admin_login_failed_revoked",
      severity: "critical",
    });
    return { ok: false, error: "REVOKED", status: 403 };
  }

  // 5. Handle user_id linkage if null
  if (admin.user_id === null) {
    const updatePayload: Record<string, unknown> = {
      user_id: user.id,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (admin.status === "invited") {
      updatePayload.status = "active";
      admin.status = "active";
    }

    const { error: updateErr } = await supabaseAdmin
      .from("admin_users")
      .update(updatePayload)
      .eq("id", admin.id);

    if (updateErr) {
      console.error("[verifyAdminAccess] Failed to link auth.users.id:", updateErr);
      if (!isOwnerEmail(normalizedEmail)) {
        return { ok: false, error: "LINKAGE_FAILED", status: 500 };
      }
    }

    admin.user_id = user.id;
    await logAdminSecurityEvent({
      adminUserId: admin.id,
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      eventType: "admin_login_success",
      severity: "info",
      metadata: { linked: true, previousStatus: "invited" },
    });
  } else if (admin.user_id !== user.id) {
    // 6. Identity mismatch validation
    await logAdminSecurityEvent({
      adminUserId: admin.id,
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      eventType: "admin_login_failed_identity_mismatch",
      severity: "critical",
      metadata: { expectedUserId: admin.user_id, receivedUserId: user.id },
    });
    return { ok: false, error: "IDENTITY_MISMATCH", status: 403 };
  }

  // 7. Update last login metadata
  const { error: loginLogErr } = await supabaseAdmin
    .from("admin_users")
    .update({
      last_login_at: new Date().toISOString(),
      last_login_ip: ip,
      updated_at: new Date().toISOString(),
    })
    .eq("id", admin.id);

  if (loginLogErr) {
    console.error("[verifyAdminAccess] Failed to update login metadata:", loginLogErr);
  }

  return { ok: true, admin };
}

export async function requireAdmin(request: Request): Promise<AdminUser> {
  const result = await verifyAdminAccess(request);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.admin;
}

export async function requireOwner(request: Request): Promise<AdminUser> {
  const admin = await requireAdmin(request);
  const normalizedEmail = normalizeEmail(admin.email);

  if (normalizedEmail !== OWNER_EMAIL || admin.role !== "owner") {
    throw new Error("OWNER_REQUIRED");
  }

  return admin;
}

export async function requirePermission(
  request: Request,
  permission: import("./admin-permissions").AdminPermission
): Promise<AdminUser> {
  const admin = await requireAdmin(request);
  const { hasPermission, ROLE_PERMISSIONS } = await import("./admin-permissions");

  const permissions = ROLE_PERMISSIONS[admin.role] || [];
  if (!hasPermission(permissions, permission)) {
    throw new Error("ADMIN_PERMISSION_DENIED");
  }

  return admin;
}

export function assertNotOwnerTarget(email: string): void {
  const normalized = normalizeEmail(email);
  if (isOwnerEmail(normalized)) {
    throw new Error("CANNOT_MODIFY_OWNER");
  }
}

