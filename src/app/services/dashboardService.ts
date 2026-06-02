import { adminFetch, isAbortError } from "@/app/services/adminApiClient";

export type DashboardStats = {
  totalUsers: number;
  totalCreators: number;
  totalBrands: number;

  pendingUsers: number;
  pendingCreators: number;
  pendingBrands: number;

  approvedUsers: number;
  approvedCreators: number;
  approvedBrands: number;

  rejectedUsers: number;
  blockedUsers: number;

  completedProfiles: number;
  incompleteProfiles: number;

  recentUsers: Array<{
    id: string;
    email: string | null;
    role: string;
    approval_status: string;
    profile_completed: boolean | null;
    created_at: string | null;
  }>;

  pendingApprovalQueue: Array<{
    id: string;
    email: string | null;
    role: string;
    approval_status: string;
    profile_completed: boolean | null;
    created_at: string | null;
  }>;

  roleBreakdown: {
    creators: number;
    brands: number;
    admins: number;
  };

  approvalBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    blocked: number;
  };

  systemHealth: {
    supabaseConnected: boolean;
    apiStatus: "healthy" | "degraded" | "down";
    lastSyncedAt: string;
  };
};

type StatsApiResponse = {
  success: boolean;
  source: string;
  data?: DashboardStats;
  error?: {
    message?: string;
    code?: string;
    details?: string | null;
    hint?: string | null;
  } | string;
};

export const dashboardService = {
  getStats: async (signal?: AbortSignal): Promise<DashboardStats> => {
    let response: Response;
    try {
      response = await adminFetch("/api/admin/dashboard/stats", {
        signal,
      });
    } catch (err: unknown) {
      if (isAbortError(err)) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Network failure: unable to connect to dashboard API. Details: ${msg}`);
    }

    let payload: StatsApiResponse;
    try {
      payload = await response.json() as StatsApiResponse;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Protocol failure: received invalid JSON from server. Details: ${msg}`);
    }

    if (!response.ok || !payload.success || !payload.data) {
      const errorMsg = typeof payload.error === 'string'
        ? payload.error
        : payload.error?.message || "Infrastructure failure: unable to sync dashboard stats.";
      throw new Error(errorMsg);
    }

    return payload.data;
  }
};
