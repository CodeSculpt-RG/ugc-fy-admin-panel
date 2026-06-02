import { adminFetch } from "@/app/services/adminApiClient";

export type SecurityEventItem = {
  id: string;
  type: string;
  severity: string;
  description: string;
  ip: string | null;
  resolved: boolean;
  created_at: string;
};

export type SecurityPayload = {
  state: "NOMINAL" | "WARNING" | "CRITICAL";
  unresolvedCount: number;
  criticalCount: number;
  highCount: number;
  totalEvents: number;
  wafFiltered: number;
  failedLoginCount24h: number;
  unauthorizedAccessCount24h: number;
  suspiciousActivityCount24h: number;
  latestIntegrityScan: string | null;
  securitySettings: Record<string, unknown> | null;
  rotationDataConfigured: boolean;
  unrotatedAdminCount: number;
  events: SecurityEventItem[];
  isMissingTable?: boolean;
  tableName?: string;
  migrationSql?: string;
};

export const securityService = {
  getSecurityStatus: async (signal?: AbortSignal): Promise<SecurityPayload> => {
    const response = await adminFetch("/api/admin/security", {
      method: "GET",
      signal,
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      source?: string;
      data?: SecurityPayload;
      isMissingTable?: boolean;
      tableName?: string;
      migrationSql?: string;
      error?: { message?: string; code?: string; details?: string | null; hint?: string | null };
    } | null;

    if (!response.ok || !payload?.success) {
      const message =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to fetch security status. HTTP ${response.status}`;

      console.error("[SecurityService] API Error:", {
        status: response.status,
        statusText: response.statusText,
        code: payload?.error?.code ?? "NO_ERROR_CODE",
        message,
      });

      throw new Error(message);
    }

    if (!payload?.data) {
      throw new Error("Empty security payload data received.");
    }

    return {
      ...payload.data,
      isMissingTable: payload.data.isMissingTable ?? payload.isMissingTable,
      tableName: payload.data.tableName ?? payload.tableName,
      migrationSql: payload.data.migrationSql ?? payload.migrationSql,
    };
  },

  executeAction: async (
    action: "verify_integrity" | "enforce_lifecycle_rotation" | "resolve_event",
    bodyPayload?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: unknown }> => {
    const response = await adminFetch("/api/admin/security/actions", {
      method: "POST",
      body: JSON.stringify({ action, ...bodyPayload }),
      dedupe: false,
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      data?: unknown;
      error?: { message?: string; code?: string; details?: string | null; hint?: string | null };
    } | null;

    if (!response.ok || !payload?.success) {
      const message =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to execute security action ${action}. HTTP ${response.status}`;

      console.error("[SecurityService] Action Error:", {
        status: response.status,
        action,
        code: payload?.error?.code ?? "NO_ERROR_CODE",
        message,
      });

      throw new Error(message);
    }

    return { success: true, data: payload.data };
  },
};
