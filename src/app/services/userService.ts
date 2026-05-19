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

const mapInternalToUser = (internal: UserInternal): User => ({
  id: internal.id,
  name: internal.full_name || "Anonymous Entity",
  email: internal.email,
  role: (internal.role.charAt(0).toUpperCase() +
    internal.role.slice(1)) as "Creator" | "Brand" | "Admin",
  status: (internal.approval_status === "approved"
    ? "Active"
    : internal.approval_status === "pending_review"
      ? "Pending"
      : "Restricted") as UserStatus,
  verification: internal.approval_status === "approved" ? "Verified" : "Unverified",
  lastActive: internal.updated_at || new Date().toISOString(),
  riskLevel: "Low" as RiskLevel,
});

export type UserDetailsData = {
  profile: Record<string, unknown> | null;
  creator_profile: Record<string, unknown> | null;
  brand_profile: Record<string, unknown> | null;
  audit_logs: Record<string, unknown>[];
};

export const userService = {
  async getUsers(): Promise<User[]> {
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

      console.error("[UserService] API Error:", {
        status: response.status,
        statusText: response.statusText,
        source: payload?.source ?? null,
        apiError: payload?.error ?? null,
        message,
      });

      throw new Error(message);
    }

    return (payload.data ?? []).map(mapInternalToUser);
  },

  async getPendingUsers(): Promise<User[]> {
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

      console.error("[UserService] API Error (Pending):", {
        status: response.status,
        statusText: response.statusText,
        source: payload?.source ?? null,
        apiError: payload?.error ?? null,
        message,
      });

      throw new Error(message);
    }

    return (payload.data ?? []).map(mapInternalToUser);
  },

  async getUserDetails(userId: string): Promise<UserDetailsData> {
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
      console.error("[UserService] Details API Error:", {
        status: response.status,
        statusText: response.statusText,
        message,
      });
      throw new Error(message);
    }

    return payload.data ?? { profile: null, creator_profile: null, brand_profile: null, audit_logs: [] };
  },
};

