import { supabase } from "@/lib/supabase/client";

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

export const securityService = {
  getSecurityStatus: async (): Promise<SecurityPayload> => {
    const response = await fetch("/api/admin/security", {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      source?: string;
      data?: SecurityPayload;
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

    return payload.data;
  },

  executeAction: async (
    action: "verify_integrity" | "enforce_lifecycle_rotation" | "resolve_event",
    bodyPayload?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: unknown }> => {
    const response = await fetch("/api/admin/security/actions", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action, ...bodyPayload }),
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
