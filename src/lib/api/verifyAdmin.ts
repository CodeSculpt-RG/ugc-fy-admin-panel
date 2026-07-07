import { verifyAdminAccess } from "../auth/admin-auth";
import { type AdminPermission, type AdminRole, type VerifiedAdmin, ROLE_PERMISSIONS } from "./adminPermissions";

export type VerifyAdminSuccess = {
  success: true;
  status: 200;
  admin: VerifiedAdmin;
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

  // Get permissions for this role from the matrix in adminPermissions.ts
  const rawRole = result.admin.role as AdminRole;
  let permissions: AdminPermission[] = ROLE_PERMISSIONS[rawRole] || [];

  // Fallback map
  if (permissions.length === 0) {
    const fallbackRole = mapToLegacyRole(result.admin.role);
    permissions = ROLE_PERMISSIONS[fallbackRole] || [];
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
  if (role === "owner") return "owner";
  if (role === "super_admin") return "super_admin";
  if (role === "moderator" || role === "campaign_manager" || role === "kyc_manager") return "moderation_admin";
  if (role === "finance") return "finance_admin";
  if (role === "support") return "support_admin";
  if (role === "moderation_admin") return "moderation_admin";
  if (role === "finance_admin") return "finance_admin";
  if (role === "support_admin") return "support_admin";
  if (role === "analyst") return "analyst";
  return "analyst";
}
