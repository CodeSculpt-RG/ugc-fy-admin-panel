import { Brand, UserStatus } from "@/app/types";
import { adminFetch } from "@/app/services/adminApiClient";

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
  profile_id?: string;
  name?: string | null;
  email?: string | null;
  platform_id?: string | null;
  company_name?: string | null;
  industry?: string | null;
  active_campaigns?: number | null;
  aggregate_gmv?: number | null;
  approval_status?: string | null;
  kyc_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  rejection_reason?: string | null;
};

type BrandsApiResponse = {
  success: boolean;
  source?: string;
  data?: BrandApiResponseRow[];
  error?: ApiError;
};

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
  async getBrands(status?: string, signal?: AbortSignal): Promise<Brand[]> {
    const url = status && status !== "all" ? `/api/admin/brands?approval_status=${status}` : "/api/admin/brands";
    const response = await adminFetch(url, {
      method: "GET",
      signal,
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
    
    return data.map((item: BrandApiResponseRow): Brand => {
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
