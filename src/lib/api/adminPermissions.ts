import type { AdminRole } from "../auth/admin-types";
export type { AdminRole };

// Standard dot notation permissions + Legacy strings for TS compatibility
export type AdminPermission =
  | "dashboard.read"
  | "users.read"
  | "users.manage"
  | "users.block"
  | "kyc.read"
  | "kyc.approve"
  | "kyc.reject"
  | "campaigns.read"
  | "campaigns.manage"
  | "moderation.read"
  | "moderation.manage"
  | "finance.read"
  | "finance.manage"
  | "finance.read_limited"
  | "support.read"
  | "support.manage"
  | "settings.read"
  | "settings.manage"
  | "admin_management.read"
  | "admin_management.write"
  | "audit.read"
  | "audit.read_limited"
  | "owner.controls"
  | "profile.read"
  | "dashboard:read"
  | "users:read"
  | "users:write"
  | "users.approve"
  | "creators.read"
  | "creators.write"
  | "creators.approve"
  | "creators.block"
  | "brands.read"
  | "brands.write"
  | "brands.approve"
  | "brands.block"
  | "campaigns:read"
  | "campaigns:write"
  | "campaigns.write"
  | "campaigns.moderate"
  | "moderation:read"
  | "moderation:write"
  | "moderation.write"
  | "finance:read"
  | "finance:write"
  | "payments.read"
  | "payments.write"
  | "escrow.read"
  | "escrow.write"
  | "refunds.read"
  | "refunds.write"
  | "disputes.read"
  | "disputes.write"
  | "support:read"
  | "support:write"
  | "analytics.read"
  | "reports.read"
  | "reports.write"
  | "settings:read"
  | "admins:read"
  | "admins:write"
  | "security_logs:read"
  | "bans:read"
  | "bans:write"
  | "infrastructure.read"
  | "audit_logs.read"
  | "security.read"
  | "security.write"
  | "settings.write"
  | "profile.update"
  | "profile.security.update"
  | "activity.read.own"
  | "activity.read.team"
  | "activity.read.all"
  | "kyc.review"
  | "kyc.media.read"
  | "kyc.history.read"
  | "kyc.notes.write"
  | "kyc:read"
  | "kyc:write";

// Legacy aliases compatibility layer mapping old formats to new formats
export const PERMISSION_ALIASES: Record<string, AdminPermission> = {
  "dashboard:read": "dashboard.read",
  "users:read": "users.read",
  "users:write": "users.manage",
  "kyc:read": "kyc.read",
  "kyc:write": "kyc.approve",
  "campaigns:read": "campaigns.read",
  "campaigns:write": "campaigns.manage",
  "moderation:read": "moderation.read",
  "moderation:write": "moderation.manage",
  "finance:read": "finance.read",
  "finance:write": "finance.manage",
  "support:read": "support.read",
  "support:write": "support.manage",
  "settings:read": "settings.read",
  "admins:read": "admin_management.read",
  "admins:write": "admin_management.write",
  "security_logs:read": "audit.read",
  "bans:read": "users.read",
  "bans:write": "users.block",
  // Legacy dot mappings
  "reports.read": "audit.read",
  "reports.write": "audit.read",
  "escrow.read": "finance.read",
  "infrastructure.read": "audit.read",
  "creators.read": "users.read",
  "brands.read": "users.read",
  "disputes.read": "support.read",
  "disputes.write": "support.manage",
  "profile.read": "dashboard.read",
  "profile.update": "dashboard.read",
  "profile.security.update": "dashboard.read",
  "security.read": "audit.read",
  "security.write": "audit.read",
  "payments.read": "finance.read",
  "payments.write": "finance.manage",
  "audit_logs.read": "audit.read",
};

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: [
    "dashboard.read",
    "users.read",
    "users.manage",
    "kyc.read",
    "kyc.approve",
    "kyc.reject",
    "users.block",
    "campaigns.read",
    "campaigns.manage",
    "moderation.read",
    "moderation.manage",
    "finance.read",
    "finance.manage",
    "support.read",
    "support.manage",
    "settings.read",
    "settings.manage",
    "admin_management.read",
    "admin_management.write",
    "audit.read",
    "owner.controls",
    "profile.read",
  ],
  super_admin: [
    "dashboard.read",
    "users.read",
    "users.manage",
    "kyc.read",
    "kyc.approve",
    "kyc.reject",
    "users.block",
    "campaigns.read",
    "campaigns.manage",
    "moderation.read",
    "moderation.manage",
    "finance.read",
    "support.read",
    "support.manage",
    "settings.read",
    "admin_management.read",
    "admin_management.write",
    "audit.read",
    "profile.read",
  ],
  moderation_admin: [
    "dashboard.read",
    "kyc.read",
    "kyc.reject",
    "moderation.read",
    "moderation.manage",
    "users.read",
    "support.read",
    "profile.read",
  ],
  finance_admin: [
    "dashboard.read",
    "finance.read",
    "finance.manage",
    "campaigns.read",
    "users.read",
    "profile.read",
  ],
  support_admin: [
    "dashboard.read",
    "support.read",
    "support.manage",
    "users.read",
    "kyc.read",
    "profile.read",
  ],
  analyst: [
    "dashboard.read",
    "users.read",
    "campaigns.read",
    "kyc.read",
    "finance.read_limited",
    "audit.read_limited",
    "profile.read",
  ],
  // Fallback for legacy roles
  admin: [
    "dashboard.read",
    "users.read",
    "kyc.read",
    "campaigns.read",
    "moderation.read",
    "support.read",
    "profile.read",
  ],
  kyc_manager: ["dashboard.read", "kyc.read", "kyc.approve", "kyc.reject", "profile.read"],
  campaign_manager: ["dashboard.read", "campaigns.read", "campaigns.manage", "profile.read"],
  moderator: ["dashboard.read", "moderation.read", "moderation.manage", "profile.read"],
  support: ["dashboard.read", "users.read", "moderation.read", "support.read", "support.manage", "profile.read"],
  finance: ["dashboard.read", "finance.read", "finance.manage", "profile.read"],
};

export interface VerifiedAdmin {
  id: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  fullName: string | null;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
  inviteStatus?: string;
}

export function normalizePermission(permission: string): AdminPermission {
  return PERMISSION_ALIASES[permission] || (permission as AdminPermission);
}

/**
 * Check if a verified admin has a specific permission.
 */
export function hasPermission(
  permissions: AdminPermission[],
  required: string
): boolean {
  const normReq = normalizePermission(required);
  return permissions.includes(normReq);
}

export const ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  "/admin/dashboard": "dashboard.read",
  "/admin/users": "users.read",
  "/admin/kyc": "kyc.read",
  "/admin/creators": "users.read",
  "/admin/brands": "users.read",
  "/admin/campaigns": "campaigns.read",
  "/admin/moderation": "moderation.read",
  "/admin/finance": "finance.read",
  "/admin/support": "support.read",
  "/admin/payments": "finance.read",
  "/admin/escrow": "finance.read",
  "/admin/disputes": "support.read",
  "/admin/analytics": "dashboard.read",
  "/admin/reports": "audit.read",
  "/admin/infrastructure": "audit.read",
  "/admin/admin-management": "admin_management.read",
  "/admin/settings/admins": "admin_management.read",
  "/admin/settings/security-logs": "audit.read",
  "/admin/settings/bans": "users.block",
  "/admin/settings/security": "profile.read",
  "/admin/audit-logs": "audit.read",
  "/admin/security": "audit.read",
  "/admin/settings": "settings.read",
  "/admin/debug-connection": "audit.read",
  "/admin/profile": "profile.read",
};
