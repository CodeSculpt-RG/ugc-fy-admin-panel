import { supabase } from "@/lib/supabase/client";
import { Payment, Escrow, Dispute } from "@/app/types";

export type FinancialPayload<T> = {
  data: T[];
  isMissingTable?: boolean;
  tableName?: string;
  migrationSql?: string;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}

export const paymentService = {
  getPayments: async (): Promise<FinancialPayload<Payment>> => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch('/api/admin/payments', { headers });
    const payload = await response.json();
    
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Protocol failure: unable to fetch payments.");
    }

    return {
      data: payload.data || [],
      isMissingTable: payload.isMissingTable,
      tableName: payload.tableName,
      migrationSql: payload.migrationSql,
    };
  },
  releasePayout: async (id: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch(`/api/admin/payments/${id}/release`, {
      method: "POST",
      headers
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Failed to release payout.");
    return payload.data;
  },
  refundPayment: async (id: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch(`/api/admin/payments/${id}/refund`, {
      method: "POST",
      headers
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Failed to process refund.");
    return payload.data;
  },
};

export const escrowService = {
  getEscrowList: async (): Promise<FinancialPayload<Escrow>> => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");
    const response = await fetch('/api/admin/escrow', { headers });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Failed to fetch escrow list.");
    return {
      data: payload.data || [],
      isMissingTable: payload.isMissingTable,
      tableName: payload.tableName,
      migrationSql: payload.migrationSql,
    };
  },
  freeze: async (id: string, reason: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");
    const response = await fetch(`/api/admin/escrow/${id}/freeze`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason })
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Failed to freeze escrow.");
    return payload.data;
  },
  release: async (id: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");
    const response = await fetch(`/api/admin/escrow/${id}/release`, {
      method: "POST",
      headers
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Failed to release escrow.");
    return payload.data;
  },
  refund: async (id: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");
    const response = await fetch(`/api/admin/escrow/${id}/refund`, {
      method: "POST",
      headers
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Failed to refund escrow.");
    return payload.data;
  },
};

export const disputeService = {
  getDisputes: async (): Promise<FinancialPayload<Dispute>> => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");
    try {
      const response = await fetch('/api/admin/disputes', { headers });
      const text = await response.text();
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}...`);
      }
      if (!response.ok || !payload.success) {
        const errorObj = payload.error as Record<string, unknown> | null | undefined;
        const errorMsg = errorObj && typeof errorObj === 'object' ? String(errorObj.message || errorObj.details || JSON.stringify(errorObj)) : String(payload.error || "Failed to fetch disputes.");
        throw new Error(errorMsg);
      }
      return {
        data: Array.isArray(payload.data) ? payload.data : [],
        isMissingTable: Boolean(payload.isMissingTable),
        tableName: typeof payload.tableName === 'string' ? payload.tableName : undefined,
        migrationSql: typeof payload.migrationSql === 'string' ? payload.migrationSql : undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[DisputeService] getDisputes error: ${msg}`);
    }
  },
  resolve: async (id: string, resolution: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");
    try {
      const response = await fetch(`/api/admin/disputes/${id}/resolve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ resolution })
      });
      const text = await response.text();
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}...`);
      }
      if (!response.ok || !payload.success) {
        const errorObj = payload.error as Record<string, unknown> | null | undefined;
        const errorMsg = errorObj && typeof errorObj === 'object' ? String(errorObj.message || errorObj.details || JSON.stringify(errorObj)) : String(payload.error || "Failed to resolve dispute.");
        throw new Error(errorMsg);
      }
      return payload.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[DisputeService] resolve error: ${msg}`);
    }
  },
  openDispute: async (payload: { targetEmailOrId: string; type: string; priority: string; description: string }) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");
    try {
      const response = await fetch('/api/admin/disputes', {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      let resData: Record<string, unknown> = {};
      try {
        resData = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}...`);
      }
      if (!response.ok || !resData.success) {
        const errorObj = resData.error as Record<string, unknown> | null | undefined;
        const errorMsg = errorObj && typeof errorObj === 'object' ? String(errorObj.message || errorObj.details || JSON.stringify(errorObj)) : String(resData.error || "Failed to open dispute case.");
        throw new Error(errorMsg);
      }
      return resData;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[DisputeService] openDispute error: ${msg}`);
    }
  },
};
