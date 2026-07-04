// =============================================================================
// Admin Roles & Permissions — Type Definitions and Helpers
// Source of truth for all admin permission checks
// =============================================================================

export type AdminRole =
  | "owner"
  | "super_admin"
  | "moderation_admin"
  | "finance_admin"
  | "support_admin"
  | "analyst";

export type AdminPermission =
  | "dashboard.read"
  | "users.read"
  | "users.write"
  | "users.approve"
  | "users.block"
  | "creators.read"
  | "creators.write"
  | "creators.approve"
  | "creators.block"
  | "brands.read"
  | "brands.write"
  | "brands.approve"
  | "brands.block"
  | "campaigns.read"
  | "campaigns.write"
  | "campaigns.moderate"
  | "moderation.read"
  | "moderation.write"
  | "payments.read"
  | "payments.write"
  | "escrow.read"
  | "escrow.write"
  | "refunds.read"
  | "refunds.write"
  | "disputes.read"
  | "disputes.write"
  | "support.read"
  | "support.write"
  | "analytics.read"
  | "reports.read"
  | "reports.write"
  | "infrastructure.read"
  | "admin_management.read"
  | "admin_management.write"
  | "audit_logs.read"
  | "security.read"
  | "security.write"
  | "settings.read"
  | "settings.write"
  | "owner.controls"
  | "profile.read"
  | "profile.update"
  | "profile.security.update"
  | "activity.read.own"
  | "activity.read.team"
  | "activity.read.all"
  | "kyc.read"
  | "kyc.review"
  | "kyc.approve"
  | "kyc.reject"
  | "kyc.media.read"
  | "kyc.history.read"
  | "kyc.notes.write";

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

/**
 * Check if a verified admin has a specific permission.
 */
export function hasPermission(
  permissions: AdminPermission[],
  required: AdminPermission
): boolean {
  return permissions.includes(required);
}

/**
 * Sidebar route → required permission mapping.
 * Frontend uses this for UX filtering; backend is the authoritative check.
 */
export const ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  "/admin/dashboard": "dashboard.read",
  "/admin/users": "users.read",
  "/admin/creators": "creators.read",
  "/admin/brands": "brands.read",
  "/admin/campaigns": "campaigns.read",
  "/admin/moderation": "moderation.read",
  "/admin/payments": "payments.read",
  "/admin/escrow": "escrow.read",
  "/admin/disputes": "disputes.read",
  "/admin/analytics": "analytics.read",
  "/admin/reports": "reports.read",
  "/admin/infrastructure": "infrastructure.read",
  "/admin/admin-management": "admin_management.read",
  "/admin/audit-logs": "audit_logs.read",
  "/admin/security": "security.read",
  "/admin/settings": "settings.read",
  "/admin/debug-connection": "infrastructure.read",
  "/admin/profile": "profile.read",
};
