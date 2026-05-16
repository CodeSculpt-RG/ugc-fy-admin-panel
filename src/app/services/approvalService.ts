import { supabase } from "@/lib/supabase/client";

type ApprovalStatus = "pending_review" | "approved" | "rejected" | "blocked";

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
    // Logic to fetch users/entities needing approval
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Administrative session expired.");

    const response = await fetch("/api/admin/users/pending", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = await response.json() as ApprovalApiResponse<PendingUser[]>;
    return payload.data || [];
  },

  updateApprovalStatus: async (
    userId: string, 
    status: ApprovalStatus, 
    reason?: string
  ): Promise<PendingUser> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Administrative session expired.");

    const response = await fetch(`/api/admin/users/${userId}/approval`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status, reason }),
    });

    const payload = await response.json() as ApprovalApiResponse<PendingUser>;
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Protocol failure: update not recognized by the ledger.");
    }

    return payload.data!;
  }
};
