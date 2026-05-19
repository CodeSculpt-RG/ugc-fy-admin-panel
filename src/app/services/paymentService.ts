import { supabase } from "@/lib/supabase/client";
import { Payment } from "@/app/types";

export type FinancialPayload<T> = {
  data: T[];
  isMissingTable?: boolean;
  tableName?: string;
  migrationSql?: string;
};

type ApiErrorPayload = {
  error?: {
    message?: unknown;
  };
  success?: unknown;
  data?: unknown;
  isMissingTable?: unknown;
  tableName?: unknown;
  migrationSql?: unknown;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}

async function parseJsonResponse(response: Response): Promise<ApiErrorPayload> {
  const text = await response.text();
  if (!text) return {};

  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    throw new Error(`Payments API returned invalid JSON with status ${response.status}.`);
  }
}

function getReadableApiError(payload: ApiErrorPayload, fallback: string): string {
  return typeof payload.error?.message === "string" && payload.error.message.trim()
    ? payload.error.message
    : fallback;
}

export const paymentService = {
  getPayments: async (): Promise<FinancialPayload<Payment>> => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch('/api/admin/payments', { headers });
    const payload = await parseJsonResponse(response);
    
    if (!response.ok || !payload.success) {
      throw new Error(getReadableApiError(payload, "Protocol failure: unable to fetch payments."));
    }

    return {
      data: Array.isArray(payload.data) ? (payload.data as Payment[]) : [],
      isMissingTable: payload.isMissingTable === true,
      tableName: typeof payload.tableName === "string" ? payload.tableName : undefined,
      migrationSql: typeof payload.migrationSql === "string" ? payload.migrationSql : undefined,
    };
  },

  releasePayout: async (id: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "paid" })
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload.success) throw new Error(getReadableApiError(payload, "Failed to release payout."));
    return payload.data;
  },

  refundPayment: async (id: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "refunded" })
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload.success) throw new Error(getReadableApiError(payload, "Failed to process refund."));
    return payload.data;
  },

  updatePaymentReview: async (id: string, reviewed: boolean) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ reviewed })
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload.success) throw new Error(getReadableApiError(payload, "Failed to mark payment as reviewed."));
    return payload.data;
  },

  retryPayout: async (id: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "processing" })
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload.success) throw new Error(getReadableApiError(payload, "Failed to retry payout."));
    return payload.data;
  }
};
