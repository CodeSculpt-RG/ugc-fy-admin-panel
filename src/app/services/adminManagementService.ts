import { supabase } from "@/lib/supabase/client";
import { AdminUser } from "@/app/types";

type ApiError = {
  message?: string;
  code?: string;
  details?: Record<string, unknown> | string | null;
  hint?: string | null;
};

type ApiResponse<T> = {
  success?: boolean; // legacy
  ok?: boolean;
  source?: string;
  message?: string;
  warning?: string | null;
  data?: T;
  admin?: T; // from the new API
  error?: ApiError;
};

type AdminProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};



function logProvisionError(message: string): void {
  console.error(`[AdminManagementService] Provision Admin Error: ${message}`);
}

export const adminManagementService = {
  getAdmins: async (): Promise<AdminUser[]> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/admins", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      const message =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to fetch administrators. HTTP ${response.status}`;
      throw new Error(message);
    }

    return (payload.data || []).map((adm: Record<string, unknown>) => ({
      id: String(adm.id || ""),
      name: String(adm.full_name || (typeof adm.email === "string" ? adm.email.split("@")[0] : "") || "Unknown"),
      email: String(adm.email || ""),
      role: String(adm.role || "admin").toUpperCase() as "OWNER" | "SUPER_ADMIN" | "MODERATION_ADMIN" | "FINANCE_ADMIN" | "SUPPORT_ADMIN" | "ANALYST",
      lastActive: adm.updated_at ? new Date(String(adm.updated_at)).toLocaleString() : "Never",
      status: (adm.approval_status === "approved" || adm.is_active === true) ? "Active" : "Suspended",
      platformId: adm.platform_id ? String(adm.platform_id) : undefined,
    }));
  },

  createAdmin: async (payload: { email: string; full_name: string; role: string; is_active: boolean }): Promise<ApiResponse<AdminProfile>> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    let resData: ApiResponse<AdminProfile> | null = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      resData = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Expected JSON but received non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`);
    }

    if (!response.ok || !(resData?.success || resData?.ok)) {
      // Return expected business errors cleanly without throwing
      if (resData?.error?.code && [
        'ADMIN_ALREADY_EXISTS',
        'ADMIN_INVITE_ALREADY_PENDING',
        'ADMIN_INVITE_FAILED_RETRY_AVAILABLE',
        'AUTH_USER_ALREADY_EXISTS',
        'ADMIN_REVOKED_REQUIRES_REACTIVATION',
        'SUPABASE_INVITE_FAILED',
        'SUPABASE_INVITE_TIMEOUT',
        'SUPABASE_EMAIL_RATE_LIMITED',
        'SUPABASE_REDIRECT_URL_NOT_ALLOWED',
        'SUPABASE_EMAIL_PROVIDER_FAILED',
        'SUPABASE_INVITE_NOT_SENT_EXISTING_USER',
        'INVITE_RESEND_COOLDOWN',
        'VALIDATION_ERROR',
        'FORBIDDEN'
      ].includes(resData.error.code)) {
        return resData;
      }

      const detailsStr = typeof resData?.error?.details === "object" && resData?.error?.details !== null
        ? JSON.stringify(resData.error.details)
        : resData?.error?.details;

      const message =
        resData?.error?.message ||
        detailsStr ||
        resData?.warning ||
        `Failed to provision admin. HTTP ${response.status}`;

      logProvisionError(String(message));
      throw new Error(String(message));
    }

    return resData;
  },

  resendInvite: async (adminId: string) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(`/api/admin/admins/${adminId}/resend-invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    let resData: ApiResponse<unknown> | null = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      resData = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Expected JSON but received non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`);
    }

    if (!response.ok || !(resData?.success || resData?.ok)) {
      if (resData?.error?.code) {
        return resData;
      }

      const message = resData?.error?.message || `Failed to resend invite. HTTP ${response.status}`;
      logProvisionError(message);
      throw new Error(message);
    }

    return resData;
  },

  linkExistingAdmin: async (payload: { email: string; full_name: string; role: string }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/admins/link-existing", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let resData: ApiResponse<unknown> | null = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      resData = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Expected JSON but received non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`);
    }

    if (!response.ok || !(resData?.success || resData?.ok)) {
      if (resData?.error?.code) {
        return resData;
      }

      const message = resData?.error?.message || `Failed to link existing user. HTTP ${response.status}`;
      logProvisionError(message);
      throw new Error(message);
    }

    return resData;
  },
};
