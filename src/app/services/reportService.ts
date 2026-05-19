import { supabase } from "@/lib/supabase/client";

export type ReportItem = {
  id: string;
  name: string;
  type: string;
  period: string;
  status: string;
  date: string;
  description: string;
  reporter: string;
  target: string;
  fileUrl?: string;
};

export type ReportsPayload = {
  data: ReportItem[];
  automationSettings?: Record<string, unknown> | null;
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

export const reportService = {
  getReports: async (): Promise<ReportsPayload> => {
    const response = await fetch("/api/admin/reports", {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      data?: ReportItem[];
      automationSettings?: Record<string, unknown> | null;
      isMissingTable?: boolean;
      tableName?: string;
      migrationSql?: string;
      error?: { message?: string; code?: string; details?: string | null; hint?: string | null };
    } | null;

    if (!response.ok || !payload?.success) {
      const message =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to fetch reports. HTTP ${response.status}`;

      throw new Error(message);
    }

    return {
      data: payload.data || [],
      automationSettings: payload.automationSettings || null,
      isMissingTable: payload.isMissingTable,
      tableName: payload.tableName,
      migrationSql: payload.migrationSql,
    };
  },

  testLink: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch("/api/admin/reports", {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Transmission test failed with status ${response.status}`);
    }

    const payload = (await response
      .json()
      .catch((): null => null)) as { success?: boolean; error?: { message?: string } } | null;

    if (!payload?.success) {
      throw new Error(payload?.error?.message || "Transmission verification returned non-success state.");
    }

    return { success: true, message: "Transmission link nominal. Verified direct database connectivity." };
  },

  exportReport: async (type: string, filters: unknown) => {
    console.log(`[REPORT SERVICE] Action: EXPORT_REPORT, Type: ${type}, Filters:`, filters);
    return { success: true, url: "#" };
  },

  generateReport: async (payload: {
    title: string;
    type: string;
    dateRange: string;
    format: string;
    notes?: string;
  }) => {
    const response = await fetch("/api/admin/reports/generate", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const resData = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      message?: string;
      data?: unknown;
      error?: { message?: string; code?: string; details?: string | null; hint?: string | null };
    } | null;

    if (!response.ok || !resData?.success) {
      const message =
        resData?.error?.message ||
        resData?.error?.details ||
        `Failed to generate report. HTTP ${response.status}`;

      throw new Error(message);
    }

    return {
      success: true,
      message: resData.message || "Report generated successfully.",
      data: resData.data,
    };
  },
};
