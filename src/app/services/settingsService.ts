import { supabase } from "@/lib/supabase/client";

export type PlatformSettingRow = {
  id: string;
  key: string;
  value: Record<string, unknown>;
  category: string;
  label: string | null;
  description: string | null;
  is_public: boolean;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
};

export type SettingsApiResponse = {
  success: boolean;
  source?: string;
  data?: PlatformSettingRow[];
  error?: {
    message?: string;
    code?: string;
    details?: string | null;
    hint?: string | null;
  };
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

export const settingsService = {
  async getSettings(): Promise<PlatformSettingRow[]> {
    const response = await fetch("/api/admin/settings", {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as SettingsApiResponse | null;

    if (!response.ok || !payload?.success) {
      const message =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to load settings. HTTP ${response.status}`;

      console.error("[SettingsService] API Error:", {
        status: response.status,
        statusText: response.statusText,
        source: payload?.source ?? "unknown",
        code: payload?.error?.code ?? "NO_ERROR_CODE",
        message,
        details: payload?.error?.details ?? null,
        hint: payload?.error?.hint ?? null,
      });

      throw new Error(message);
    }

    return payload?.data ?? [];
  },

  async updateSetting(key: string, value: Record<string, unknown>): Promise<PlatformSettingRow> {
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ key, value }),
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      source?: string;
      data?: PlatformSettingRow;
      error?: { message?: string; code?: string; details?: string | null; hint?: string | null };
    } | null;

    if (!response.ok || !payload?.success) {
      const message =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to update setting ${key}. HTTP ${response.status}`;

      console.error("[SettingsService] Update Error:", {
        status: response.status,
        statusText: response.statusText,
        key,
        code: payload?.error?.code ?? "NO_ERROR_CODE",
        message,
      });

      throw new Error(message);
    }

    if (!payload?.data) {
      throw new Error(`Failed to update setting ${key}. Empty response data.`);
    }

    return payload.data;
  },
};
