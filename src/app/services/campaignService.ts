import { supabase } from "@/lib/supabase/client";
import { Campaign } from "@/app/types";

type ApiError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

type CampaignApiResponse = {
  success: boolean;
  source?: string;
  data?: Campaign[];
  error?: ApiError;
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

function getApiErrorMessage(
  response: Response,
  payload: CampaignApiResponse | null
): string {
  return (
    payload?.error?.message ||
    payload?.error?.details ||
    `Failed to load campaigns. HTTP ${response.status}`
  );
}

export const campaignService = {
  async getCampaigns(): Promise<Campaign[]> {
    const response = await fetch("/api/admin/campaigns", {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as CampaignApiResponse | null;

    if (!response.ok || !payload?.success) {
      const message = getApiErrorMessage(response, payload);

      console.error("[CampaignService] API Error:", {
        status: response.status,
        statusText: response.statusText,
        source: payload?.source ?? null,
        apiError: payload?.error ?? null,
        message,
      });

      throw new Error(message);
    }

    return payload.data ?? [];
  },

  async updateStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<Campaign[]> {
    const response = await fetch(`/api/admin/campaigns/${id}/status`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as CampaignApiResponse | null;

    if (!response.ok || !payload?.success) {
      const message =
        payload?.error?.message ||
        `Directive rejected: unable to update campaign status. HTTP ${response.status}`;

      console.error("[CampaignService] Status Update Error:", {
        id,
        status,
        apiError: payload?.error ?? null,
        message,
      });

      throw new Error(message);
    }

    return Array.isArray(payload?.data) ? payload.data : payload?.data ? [payload.data as unknown as Campaign] : [];
  },
};
