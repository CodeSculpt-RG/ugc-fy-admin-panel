import { User, UserStatus, RiskLevel } from "@/app/types";
import { adminFetch } from "@/app/services/adminApiClient";

type BrandProfileMin = {
  company_name?: string | null;
  brand_name?: string | null;
  contact_name?: string | null;
  kyc_status?: string | null;
  approval_status?: string | null;
};

type CreatorProfileMin = {
  full_name?: string | null;
  username?: string | null;
  creator_name?: string | null;
  display_name?: string | null;
  kyc_status?: string | null;
  approval_status?: string | null;
};

export type UserInternal = {
  id: string;
  email: string;
  role: "creator" | "brand" | "admin";
  full_name: string | null;
  name?: string | null;
  approval_status: "pending_review" | "approved" | "rejected" | "blocked";
  updated_at: string;
  created_at?: string;
  phone?: string | null;
  platform_id?: string | null;
  brand_profiles?: BrandProfileMin | BrandProfileMin[];
  creator_profiles?: CreatorProfileMin | CreatorProfileMin[];
};

type ApiError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

type UserApiResponse = {
  success: boolean;
  source?: string;
  data?: UserInternal[];
  error?: ApiError;
  meta?: {
    partial?: boolean;
    missingTables?: string[];
    warnings?: string[];
  };
};

export type UsersMeta = NonNullable<UserApiResponse["meta"]>;

let latestUsersMeta: UsersMeta | null = null;

function getApiErrorMessage(
  response: Response,
  payload: UserApiResponse | null
): string {
  return (
    payload?.error?.message ||
    payload?.error?.details ||
    `Failed to load identities. HTTP ${response.status}`
  );
}

type NormalizedApiError = {
  message: string;
  status?: number;
  code?: string;
};

function normalizeApiError(error: unknown): NormalizedApiError {
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return {
      message: (error as { message: string }).message,
    };
  }

  return {
    message: "Unknown API error",
  };
}

function getDisplayName(internal: UserInternal): string {
  let subName: string | undefined;
  if (internal.role === 'brand') {
    const bp = Array.isArray(internal.brand_profiles) ? internal.brand_profiles[0] : internal.brand_profiles;
    subName = bp?.company_name || bp?.brand_name || bp?.contact_name || undefined;
  } else if (internal.role === 'creator') {
    const cp = Array.isArray(internal.creator_profiles) ? internal.creator_profiles[0] : internal.creator_profiles;
    subName = cp?.full_name || cp?.username || cp?.creator_name || cp?.display_name || undefined;
  }

  return (
    internal.full_name ||
    internal.name ||
    subName ||
    internal.email ||
    internal.platform_id ||
    "Unnamed User"
  );
}

function deriveVerificationStatus(internal: UserInternal): "Verified" | "Unverified" {
  const cp = Array.isArray(internal.creator_profiles) ? internal.creator_profiles[0] : internal.creator_profiles;
  if (cp?.kyc_status) return cp.kyc_status === 'approved' ? 'Verified' : 'Unverified';
  if (cp?.approval_status) return cp.approval_status === 'approved' ? 'Verified' : 'Unverified';

  const bp = Array.isArray(internal.brand_profiles) ? internal.brand_profiles[0] : internal.brand_profiles;
  if (bp?.kyc_status) return bp.kyc_status === 'approved' ? 'Verified' : 'Unverified';
  if (bp?.approval_status) return bp.approval_status === 'approved' ? 'Verified' : 'Unverified';

  if (internal.approval_status) return internal.approval_status === 'approved' ? 'Verified' : 'Unverified';

  return 'Unverified';
}

const mapInternalToUser = (internal: UserInternal): User => ({
  id: internal.id,
  name: getDisplayName(internal),
  email: internal.email,
  role: (internal.role.charAt(0).toUpperCase() +
    internal.role.slice(1)) as "Creator" | "Brand" | "Admin",
  status: (internal.approval_status || "pending") as UserStatus,
  verification: deriveVerificationStatus(internal),
  lastActive: internal.updated_at || new Date().toISOString(),
  riskLevel: "Low" as RiskLevel,
  platformId: internal.platform_id || undefined,
  phone: internal.phone || undefined,
  createdAt: internal.created_at || internal.updated_at || undefined,
});

export type UserDetailsData = {
  profile: Record<string, unknown> | null;
  creator_profile: Record<string, unknown> | null;
  brand_profile: Record<string, unknown> | null;
  audit_logs: Record<string, unknown>[];
};

export const userService = {
  async getUsers(signal?: AbortSignal): Promise<User[]> {
    try {
      const response = await adminFetch("/api/admin/users", {
        method: "GET",
        signal,
      });

      const payload = (await response
        .json()
        .catch((): null => null)) as UserApiResponse | null;

      if (!response.ok || !payload?.success) {
        const message = getApiErrorMessage(response, payload);
        throw new Error(message);
      }

      if (payload.meta?.partial && process.env.NODE_ENV !== "production") {
        console.warn("[UserService] User data loaded with partial optional profile data:", payload.meta);
      }
      latestUsersMeta = payload.meta ?? null;

      return (payload.data ?? []).map(mapInternalToUser);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[UserService] Recoverable API issue:", normalizeApiError(error).message);
      }
      throw error;
    }
  },

  getLastUsersMeta(): UsersMeta | null {
    return latestUsersMeta;
  },

  async getPendingUsers(signal?: AbortSignal): Promise<User[]> {
    try {
      const response = await adminFetch("/api/admin/users/pending", {
        method: "GET",
        signal,
      });

      const payload = (await response
        .json()
        .catch((): null => null)) as UserApiResponse | null;

      if (!response.ok || !payload?.success) {
        const message = getApiErrorMessage(response, payload);
        throw new Error(message);
      }

      return (payload.data ?? []).map(mapInternalToUser);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[UserService] Recoverable API issue:", normalizeApiError(error).message);
      }
      throw error;
    }
  },

  async getUserDetails(userId: string, signal?: AbortSignal): Promise<UserDetailsData> {
    try {
      const response = await adminFetch(`/api/admin/users/${userId}/details`, {
        method: "GET",
        signal,
      });

      const payload = (await response
        .json()
        .catch((): null => null)) as { success?: boolean; data?: UserDetailsData; error?: ApiError } | null;

      if (!response.ok || !payload?.success) {
        const message = payload?.error?.message || payload?.error?.details || `Failed to load user details. HTTP ${response.status}`;
        throw new Error(message);
      }

      return payload.data ?? { profile: null, creator_profile: null, brand_profile: null, audit_logs: [] };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[UserService] Recoverable API issue:", normalizeApiError(error).message);
      }
      throw error;
    }
  },
};
