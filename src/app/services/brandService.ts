import { supabase } from "@/lib/supabase/client";

import { Brand, UserStatus } from "@/app/types";

export type ApprovalStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "blocked";

type ApiError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

type BrandApiResponseRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  approval_status?: ApprovalStatus | string;
  rejection_reason?: string | null;
  updated_at?: string | null;
  profile?: {
    id: string;
    company_name?: string | null;
    industry?: string | null;
  } | null;
};

type BrandsApiResponse = {
  success: boolean;
  source?: string;
  data?: BrandApiResponseRow[];
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
  payload: BrandsApiResponse | null
): string {
  return (
    payload?.error?.message ||
    payload?.error?.details ||
    `Failed to load brands. HTTP ${response.status}`
  );
}

export const brandService = {
  async getBrands(status?: string): Promise<Brand[]> {
    const url = status && status !== "all" ? `/api/admin/brands?approval_status=${status}` : "/api/admin/brands";
    const response = await fetch(url, {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as BrandsApiResponse | null;

    if (!response.ok || !payload?.success) {
      const message = getApiErrorMessage(response, payload);

      console.error("[BrandService] API Error:", {
        status: response.status,
        statusText: response.statusText,
        source: payload?.source ?? null,
        apiError: payload?.error ?? null,
        message,
      });

      throw new Error(message);
    }

    const data = payload.data ?? [];
    
    return data.map((item: any): Brand => {
      const approvalStatus = (item.approval_status as ApprovalStatus) || "pending_review";
      
      return {
        id: item.id,
        name: item.name || "Unnamed Brand",
        email: item.email || "",
        company: item.company_name || "Unregistered Corp",
        industry: item.industry || "Commercial",
        activeCampaigns: item.active_campaigns || 0,
        totalSpend: "₹" + (item.aggregate_gmv || 0),
        status: (approvalStatus === 'approved' ? 'Active' : approvalStatus === 'pending_review' ? 'Pending' : 'Restricted') as UserStatus,
        approvalStatus: approvalStatus,
        risk: "Low",
        lastActive: item.updated_at || new Date().toISOString(),
        disputes: 0,
        rejectionReason: item.rejection_reason || undefined,
        platformId: item.platform_id || ""
      };
    });
  },
};
