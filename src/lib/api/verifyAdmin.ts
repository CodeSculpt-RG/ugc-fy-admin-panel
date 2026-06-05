import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../supabase/admin";
import type { AdminPermission, AdminRole, VerifiedAdmin } from "./adminPermissions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Infrastructure Failure: Supabase configuration missing for admin verification.");
}

const resolvedSupabaseUrl: string = supabaseUrl;
const resolvedSupabaseAnonKey: string = supabaseAnonKey;

export type VerifyAdminSuccess = {
  success: true;
  status: 200;
  admin: VerifiedAdmin;
  // Legacy compat — some routes still read `user`
  user: VerifiedAdmin;
};

export type VerifyAdminFailure = {
  success: false;
  status: number;
  error: {
    message: string;
    code: string;
    details: string | null;
    hint: string | null;
  };
};

export type VerifyAdminResult = VerifyAdminSuccess | VerifyAdminFailure;

/**
 * Verify the admin bearer token, load the admin_profiles record,
 * and hydrate their full permission list from admin_role_permissions.
 *
 * Returns a typed VerifyAdminResult — always check `result.success` before
 * accessing `result.admin`.
 */
export async function verifyAdmin(request: Request): Promise<VerifyAdminResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false,
      status: 401,
      error: {
        message: "Admin session missing. Please login again.",
        code: "ADMIN_SESSION_MISSING",
        details: null,
        hint: "Login again from the admin panel.",
      },
    };
  }

  const token = authHeader.replace("Bearer ", "");

  // Verify the JWT with Supabase Auth
  const supabaseUserClient = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser(token);

  if (userError || !user) {
    return {
      success: false,
      status: 401,
      error: {
        message: "Invalid or expired administrative session.",
        code: "ADMIN_SESSION_EXPIRED",
        details: userError?.message ?? null,
        hint: "Login again from the admin panel.",
      },
    };
  }

  // Load the admin_profiles record (bypasses RLS via service role)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .select("id, email, full_name, role, is_active, invited_by, must_change_password")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Fallback: for the bootstrap owner who may not yet have an admin_profiles row,
    // check the users table role column.
    const { data: fallbackUser } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .single();

    if (fallbackUser?.role === "admin" || fallbackUser?.role === "owner") {
      // Treat as owner during bootstrap — no role_permissions row needed
      const bootstrapAdmin: VerifiedAdmin = {
        id: fallbackUser.id,
        email: fallbackUser.email,
        role: "owner",
        permissions: getAllPermissions(),
        isActive: true,
        fullName: null,
      };
      return { success: true, status: 200, admin: bootstrapAdmin, user: bootstrapAdmin };
    }

    return {
      success: false,
      status: 403,
      error: {
        message: "Administrative profile not found. Contact your platform owner.",
        code: "ADMIN_PROFILE_MISSING",
        details: profileError?.message ?? null,
        hint: "Contact your platform owner to create an administrative profile.",
      },
    };
  }

  if (!profile.is_active) {
    return {
      success: false,
      status: 403,
      error: {
        message: "Administrative account is deactivated. Contact your platform owner.",
        code: "ADMIN_ACCOUNT_DEACTIVATED",
        details: null,
        hint: "Contact your platform owner to reactivate your account.",
      },
    };
  }

  // Load permissions for this role
  const { data: permsData, error: permsError } = await supabaseAdmin
    .from("admin_role_permissions")
    .select("permission")
    .eq("role", profile.role as AdminRole);

  if (permsError) {
    return {
      success: false,
      status: 500,
      error: {
        message: "Failed to load role permissions. Contact your platform owner.",
        code: "ROLE_PERMISSIONS_ERROR",
        details: permsError.message,
        hint: "Contact your platform owner or verify database schema.",
      },
    };
  }

  const permissions = (permsData ?? []).map((p) => p.permission as AdminPermission);

  const admin: VerifiedAdmin = {
    id: profile.id,
    email: profile.email,
    role: profile.role as AdminRole,
    permissions,
    isActive: profile.is_active,
    fullName: profile.full_name ?? null,
    mustChangePassword: profile.must_change_password ?? false,
  };

  return { success: true, status: 200, admin, user: admin };
}

/** Returns every permission — used only for owner bootstrap fallback */
function getAllPermissions(): AdminPermission[] {
  return [
    "dashboard.read",
    "users.read", "users.write", "users.approve", "users.block",
    "creators.read", "creators.write", "creators.approve", "creators.block",
    "brands.read", "brands.write", "brands.approve", "brands.block",
    "campaigns.read", "campaigns.write", "campaigns.moderate",
    "moderation.read", "moderation.write",
    "payments.read", "payments.write",
    "escrow.read", "escrow.write",
    "refunds.read", "refunds.write",
    "disputes.read", "disputes.write",
    "support.read", "support.write",
    "analytics.read",
    "reports.read", "reports.write",
    "infrastructure.read",
    "admin_management.read", "admin_management.write",
    "audit_logs.read",
    "security.read", "security.write",
    "settings.read", "settings.write",
    "owner.controls",
  ];
}
