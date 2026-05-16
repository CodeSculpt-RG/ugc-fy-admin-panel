import { supabase } from "@/lib/supabase/client";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}

export const paymentService = {
  getPayments: async () => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch('/api/admin/payments', { headers });
    const payload = await response.json();
    
    if (!response.ok || !payload.success) {
      return []; // Return empty for now as API might not be ready, but log if error
    }

    return payload.data || [];
  },
  releasePayout: async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/admin/payments/${id}/release`, {
      method: "POST",
      headers
    });
    return await response.json();
  },
};

export const escrowService = {
  getEscrowList: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/admin/escrow', { headers });
    const payload = await response.json();
    return payload.data || [];
  },
  freeze: async (id: string, reason: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/admin/escrow/${id}/freeze`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason })
    });
    return await response.json();
  },
  release: async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/admin/escrow/${id}/release`, {
      method: "POST",
      headers
    });
    return await response.json();
  },
};

export const disputeService = {
  getDisputes: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/admin/disputes', { headers });
    const payload = await response.json();
    return payload.data || [];
  },
  resolve: async (id: string, resolution: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/admin/disputes/${id}/resolve`, {
      method: "POST",
      headers,
      body: JSON.stringify({ resolution })
    });
    return await response.json();
  },
};
