import { supabase } from "@/lib/supabase/client";
import { User, UserStatus, RiskLevel } from "@/app/types";

export type UserInternal = {
  id: string;
  email: string;
  role: "creator" | "brand" | "admin";
  full_name: string | null;
  approval_status: "pending_review" | "approved" | "rejected" | "blocked";
  is_verified: boolean | null;
  updated_at: string;
  phone?: string | null;
  platform_id?: string | null;
  brand_profiles?: Record<string, unknown> | Record<string, unknown>[];
  creator_profiles?: Record<string, unknown> | Record<string, unknown>[];
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
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.access_token) {
    throw new Error("Admin session missing. Please login again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

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

function normalizeApiError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error, Object.getOwnPropertyNames(error));
  }

  return String(error);
}

function getDisplayName(internal: any): string {
  let subName: string | undefined;
  if (internal.role === 'brand') {
    const bp = Array.isArray(internal.brand_profiles) ? internal.brand_profiles[0] : internal.brand_profiles;
    subName = bp?.company_name || bp?.brand_name || bp?.contact_name;
  } else if (internal.role === 'creator') {
    const cp = Array.isArray(internal.creator_profiles) ? internal.creator_profiles[0] : internal.creator_profiles;
    subName = cp?.full_name || cp?.username || cp?.creator_name || cp?.display_name;
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

const mapInternalToUser = (internal: any): User => ({
  id: internal.id,
  name: getDisplayName(internal),
  email: internal.email,
  role: (internal.role.charAt(0).toUpperCase() +
    internal.role.slice(1)) as "Creator" | "Brand" | "Admin",
  status: (internal.approval_status || "pending") as UserStatus,
  verification: internal.is_verified || internal.approval_status === "approved" ? "Verified" : "Unverified",
  lastActive: internal.updated_at || new Date().toISOString(),
  riskLevel: "Low" as RiskLevel,
  platformId: internal.platform_id || undefined,
  phone: internal.phone || undefined,
  createdAt: internal.created_at || internal.updated_at || undefined,
} as any);

export type UserDetailsData = {
  profile: Record<string, unknown> | null;
  creator_profile: Record<string, unknown> | null;
  brand_profile: Record<string, unknown> | null;
  audit_logs: Record<string, unknown>[];
};

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: await getAuthHeaders(),
        cache: "no-store",
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
      console.error("[UserService] API Error:", normalizeApiError(error));
      throw error;
    }
  },

  async getPendingUsers(): Promise<User[]> {
    try {
      const response = await fetch("/api/admin/users/pending", {
        method: "GET",
        headers: await getAuthHeaders(),
        cache: "no-store",
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
      console.error("[UserService] API Error:", normalizeApiError(error));
      throw error;
    }
  },

  async getUserDetails(userId: string): Promise<UserDetailsData> {
    try {
      const response = await fetch(`/api/admin/users/${userId}/details`, {
        method: "GET",
        headers: await getAuthHeaders(),
        cache: "no-store",
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
      console.error("[UserService] API Error:", normalizeApiError(error));
      throw error;
    }
  },
};

