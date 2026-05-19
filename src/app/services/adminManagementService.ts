import { supabase } from "@/lib/supabase/client";
import { AdminUser } from "@/app/types";

type ApiError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  source?: string;
  message?: string;
  warning?: string | null;
  data?: T;
  error?: ApiError;
  temp_credentials?: {
    email: string;
    temporaryPassword: string;
    role: string;
  } | null;
};

type AdminProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function resolveApiErrorMessage(
  response: Response,
  payload: ApiResponse<unknown> | null
): string {
  return (
    payload?.error?.message ||
    payload?.error?.details ||
    payload?.warning ||
    `Failed to provision admin. HTTP ${response.status}`
  );
}

function logProvisionError(
  response: Response,
  payload: ApiResponse<unknown> | null,
  message: string
): void {
  console.error("[AdminManagementService] Provision Admin Error:", {
    status: response.status,
    statusText: response.statusText,
    source: payload?.source ?? "unknown",
    code: payload?.error?.code ?? "NO_ERROR_CODE",
    message,
    details: payload?.error?.details ?? null,
    hint: payload?.error?.hint ?? null,
  });
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
      role: String(adm.role || "analyst").toUpperCase(),
      lastActive: adm.updated_at ? new Date(String(adm.updated_at)).toLocaleString() : "Never",
      status: adm.is_active ? "Active" : "Suspended",
    }));
  },

  createAdmin: async (payload: { email: string; full_name: string; role: string; is_active: boolean }): Promise<ApiResponse<AdminProfile>> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/admins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resData = (await response
      .json()
      .catch((): null => null)) as ApiResponse<AdminProfile> | null;

    if (!response.ok || !resData?.success) {
      const message = resolveApiErrorMessage(response, resData);

      logProvisionError(response, resData, message);

      throw new Error(message);
    }

    return resData;
  },
};
