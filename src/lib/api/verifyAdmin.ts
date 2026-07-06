import { verifyAdminAccess } from "../auth/admin-auth";
import type { AdminPermission, AdminRole, VerifiedAdmin } from "./adminPermissions";
import { supabaseAdmin } from "../supabase/admin";

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

export async function verifyAdmin(request: Request): Promise<VerifyAdminResult> {
  const result = await verifyAdminAccess(request);
  if (!result.ok) {
    return {
      success: false,
      status: result.status,
      error: {
        message: result.error,
        code: result.error,
        details: null,
        hint: null,
      },
    };
  }

  // Get permissions for this role from admin_role_permissions table
  let permissions: AdminPermission[] = [];
  const { data: permsData, error: permsError } = await supabaseAdmin
    .from("admin_role_permissions")
    .select("permission")
    .eq("role", result.admin.role);

  if (!permsError && permsData && permsData.length > 0) {
    permissions = permsData.map((p) => p.permission as AdminPermission);
  } else {
    // Fallback matrix if permissions are missing
    if (result.admin.role === "owner" || result.admin.role === "super_admin") {
      permissions = getAllPermissions();
    } else {
      permissions = getAllPermissions().filter((p) => p.endsWith(".read") || p.startsWith("profile."));
    }
  }

  const verifiedAdmin: VerifiedAdmin = {
    id: result.admin.id,
    email: result.admin.email,
    role: mapToLegacyRole(result.admin.role),
    permissions,
    isActive: result.admin.status === "active",
    fullName: result.admin.full_name,
    avatarUrl: null,
    mustChangePassword: false,
    inviteStatus: result.admin.status,
  };

  return {
    success: true,
    status: 200,
    admin: verifiedAdmin,
    user: verifiedAdmin,
  };
}

function mapToLegacyRole(role: string): AdminRole {
  // Map our lowercase roles to the legacy app/lib/api/adminPermissions.ts expected format
  if (role === "owner") return "owner";
  if (role === "super_admin") return "super_admin";
  if (role === "moderator" || role === "campaign_manager" || role === "kyc_manager") return "moderation_admin";
  if (role === "finance") return "finance_admin";
  if (role === "support") return "support_admin";
  return "analyst";
}

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
    "profile.read", "profile.update", "profile.security.update",
    "activity.read.own", "activity.read.team", "activity.read.all",
    "kyc.read", "kyc.review", "kyc.approve", "kyc.reject", "kyc.media.read", "kyc.history.read", "kyc.notes.write"
  ];
}
