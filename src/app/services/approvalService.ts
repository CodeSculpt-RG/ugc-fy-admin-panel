import { adminFetch } from "@/app/services/adminApiClient";

type ApprovalStatus = "pending_review" | "approved" | "rejected" | "blocked" | "on_hold" | "pending" | "deleted";

export type PendingUser = {
  id: string;
  email: string | null;
  role: "creator" | "brand" | "admin";
  full_name: string | null;
  approval_status: ApprovalStatus;
  profile_completed: boolean | null;
  created_at: string | null;
};

type ApprovalApiResponse<T> = {
  success: boolean;
  source?: string;
  data?: T;
  count?: number;
  error?: {
    message?: string;
    code?: string;
    details?: string | null;
    hint?: string | null;
  };
};

export const approvalService = {
  getApprovals: async (status: string = "pending", role: string = "all") => {
    const params = new URLSearchParams({ status, role });
    const response = await adminFetch(`/api/admin/users/pending?${params.toString()}`, {
      method: "GET",
    });

    const payload = await response.json() as ApprovalApiResponse<PendingUser[]>;
    return payload.data || [];
  },

  getUserFullDetails: async (userId: string) => {
    const response = await adminFetch(`/api/admin/users/${userId}/details`, {
      method: "GET",
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = await response.json() as ApprovalApiResponse<any>;
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Failed to load user details");
    }
    return payload.data;
  },

  updateApprovalStatus: async (
    userId: string, 
    status: ApprovalStatus, 
    reason?: string
  ): Promise<PendingUser> => {
    const response = await adminFetch(`/api/admin/users/${userId}/approval`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
      dedupe: false,
    });

    const payload = await response.json() as ApprovalApiResponse<PendingUser>;
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Protocol failure: update not recognized by the ledger.");
    }

    return payload.data!;
  }
};
