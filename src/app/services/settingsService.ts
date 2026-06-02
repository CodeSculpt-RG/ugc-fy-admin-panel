import { adminFetch } from "@/app/services/adminApiClient";

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
  isMissingTable?: boolean;
  tableName?: string;
  migrationSql?: string;
  error?: {
    message?: string;
    code?: string;
    details?: string | null;
    hint?: string | null;
  };
};

export class SettingsMissingTableError extends Error {
  tableName: string;
  migrationSql: string;

  constructor(tableName: string, migrationSql: string) {
    super(`Missing required table: ${tableName}`);
    this.name = "SettingsMissingTableError";
    this.tableName = tableName;
    this.migrationSql = migrationSql;
  }
}

export const settingsService = {
  async getSettings(signal?: AbortSignal): Promise<PlatformSettingRow[]> {
    const response = await adminFetch("/api/admin/settings", {
      method: "GET",
      signal,
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as SettingsApiResponse | null;

    if (payload?.isMissingTable && payload.tableName && payload.migrationSql) {
      throw new SettingsMissingTableError(payload.tableName, payload.migrationSql);
    }

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
    const response = await adminFetch("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ key, value }),
      dedupe: false,
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
