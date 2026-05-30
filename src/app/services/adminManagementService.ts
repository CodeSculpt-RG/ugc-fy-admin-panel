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
      const message =
        resData?.error?.message ||
        resData?.error?.details ||
        resData?.warning ||
        `Failed to provision admin. HTTP ${response.status}`;

      logProvisionError(message);

      throw new Error(message);
    }

    return resData;
  },
};
