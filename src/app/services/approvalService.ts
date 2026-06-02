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
  getApprovals: async () => {
    const response = await adminFetch("/api/admin/users/pending", {
      method: "GET",
    });

    const payload = await response.json() as ApprovalApiResponse<PendingUser[]>;
    return payload.data || [];
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
