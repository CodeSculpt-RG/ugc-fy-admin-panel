import type { AdminRole } from "@/lib/auth/admin-types";

export type AdminPermission =
  | "dashboard:read"
  | "users:read"
  | "kyc:read"
  | "kyc:write"
  | "campaigns:read"
  | "campaigns:write"
  | "moderation:read"
  | "moderation:write"
  | "finance:read"
  | "finance:write"
  | "support:read"
  | "support:write"
  | "settings:read"
  | "admins:read"
  | "admins:write"
  | "security_logs:read"
  | "bans:read"
  | "bans:write";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: [
    "dashboard:read",
    "users:read",
    "kyc:read",
    "kyc:write",
    "campaigns:read",
    "campaigns:write",
    "moderation:read",
    "moderation:write",
    "finance:read",
    "finance:write",
    "support:read",
    "support:write",
    "settings:read",
    "admins:read",
    "admins:write",
    "security_logs:read",
    "bans:read",
    "bans:write",
  ],
  super_admin: [
    "dashboard:read",
    "users:read",
    "kyc:read",
    "kyc:write",
    "campaigns:read",
    "campaigns:write",
    "moderation:read",
    "moderation:write",
    "finance:read",
    "support:read",
    "support:write",
  ],
  admin: [
    "dashboard:read",
    "users:read",
    "kyc:read",
    "campaigns:read",
    "moderation:read",
    "support:read",
  ],
  kyc_manager: ["dashboard:read", "kyc:read", "kyc:write"],
  campaign_manager: ["dashboard:read", "campaigns:read", "campaigns:write"],
  moderator: ["dashboard:read", "moderation:read", "moderation:write"],
  support: ["dashboard:read", "users:read", "moderation:read", "support:read", "support:write"],
  finance: ["dashboard:read", "finance:read", "finance:write"],
};

export function hasPermission(
  role: AdminRole,
  permission: AdminPermission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermissionForRole(
  role: AdminRole,
  permission: AdminPermission
): void {
  if (!hasPermission(role, permission)) {
    throw new Error("ADMIN_PERMISSION_DENIED");
  }
}
