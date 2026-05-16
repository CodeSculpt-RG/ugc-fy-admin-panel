import { supabase } from "@/lib/supabase/client";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}

export const campaignService = {
  getCampaigns: async () => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch('/api/admin/campaigns', { headers });
    
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Protocol failure: unable to fetch campaigns.");
    }

    return payload.data || [];
  },

  updateStatus: async (id: string, status: string, reason?: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch(`/api/admin/campaigns/${id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status, reason })
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Directive rejected: unable to update campaign status.");
    }

    return payload.data;
  }
};
