import { supabase } from "@/lib/supabase/client";
import { Creator, UserStatus } from "@/app/types";

export type ApprovalStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "blocked";

export type CreatorApiResponseRow = {
  id: string;
  email: string | null;
  role: "creator" | string;
  full_name: string | null;
  avatar_url: string | null;
  approval_status: ApprovalStatus | string;
  profile_completed: boolean | null;
  rejection_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  creator_profile: {
    id: string;
    creator_name: string | null;
    phone: string | null;
    instagram_url: string | null;
    youtube_url: string | null;
    niche: string | null;
    location: string | null;
    bio: string | null;
    followers?: string;
    rating?: number;
    earnings?: string;
  } | null;
};

type ApiError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

type CreatorsApiResponse = {
  success: boolean;
  source?: string;
  data?: CreatorApiResponseRow[];
  count?: number;
  error?: ApiError;
};

function safeApiErrorMessage(
  response: Response,
  payload: CreatorsApiResponse | null
): string {
  return (
    payload?.error?.message ||
    payload?.error?.details ||
    `Failed to load creators. HTTP ${response.status}`
  );
}

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

export const creatorService = {
  async getCreators(approvalStatus = "approved"): Promise<Creator[]> {
    const params = new URLSearchParams();

    if (approvalStatus && approvalStatus !== "all") {
      params.set("approval_status", approvalStatus);
    }

    const url = `/api/admin/creators${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as CreatorsApiResponse | null;

    if (!response.ok || !payload?.success) {
      const message = safeApiErrorMessage(response, payload);

      console.error("[CreatorService] API Error:", {
        status: response.status,
        statusText: response.statusText,
        source: payload?.source ?? "unknown",
        code: payload?.error?.code ?? "NO_ERROR_CODE",
        message,
        details: payload?.error?.details ?? null,
        hint: payload?.error?.hint ?? null,
      });

      throw new Error(message);
    }

    return (payload.data ?? []).map((row: any): Creator => {
      const appStatus = (row.approval_status as ApprovalStatus) || "pending_review";
      
      return {
        id: row.id,
        name: row.name || "New Creator",
        email: row.email || "",
        niche: row.category || "General",
        followers: row.creator_profile?.followers || "0",
        status: (appStatus === 'approved' ? 'Active' : appStatus === 'pending_review' ? 'Pending' : 'Restricted') as UserStatus,
        approvalStatus: appStatus,
        risk: "Low",
        lastActive: row.updated_at || row.created_at || new Date().toISOString(),
        earnings: row.creator_profile?.earnings || "₹0",
        rating: row.creator_profile?.rating || 5.0,
        approvedAt: row.approved_at || undefined,
        approvedBy: row.approved_by || undefined,
        rejectionReason: row.rejection_reason || undefined,
        platformId: row.platform_id || ""
      };
    });
  },
};
