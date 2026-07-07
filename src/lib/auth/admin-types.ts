export const OWNER_EMAIL = "ugcfybycreatornavigator@gmail.com";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalizeEmail(email) === OWNER_EMAIL;
}

/**
 * Returns true only when BOTH conditions are met:
 * 1. NODE_ENV is not "production"
 * 2. ENABLE_OWNER_DEV_FALLBACK is explicitly set to "true"
 *
 * This gates the emergency owner fallback so it never activates in production.
 */
export function isOwnerDevFallbackEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_OWNER_DEV_FALLBACK === "true"
  );
}

export function isAdminUsersMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  const code = typeof err.code === "string" ? err.code : "";
  const text = [err.message, err.details, err.hint]
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .toLowerCase();

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    (
      text.includes("admin_users") &&
      (
        text.includes("does not exist") ||
        text.includes("could not find the table") ||
        text.includes("schema cache")
      )
    )
  );
}

export type AdminRole =
  | "owner"
  | "super_admin"
  | "admin"
  | "kyc_manager"
  | "campaign_manager"
  | "moderator"
  | "support"
  | "finance"
  | "moderation_admin"
  | "finance_admin"
  | "support_admin"
  | "analyst";

export type AdminStatus =
  | "invited"
  | "active"
  | "suspended"
  | "revoked";

export type AdminUser = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: AdminRole;
  status: AdminStatus;
  password_enabled: boolean;
  created_at?: string;
  updated_at?: string;

  // Compatibility fields for the rest of the codebase
  name?: string | null;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
  inviteStatus?: string;
  isActive?: boolean;
  permissions?: string[];
  last_login_at?: string | null;
  last_login_ip?: string | null;
};
