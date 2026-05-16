import { supabase } from "@/lib/supabase/client";

export type DashboardStats = {
  creators: number;
  brands: number;
  pending: number;
  approved: number;
  rejected: number;
  blocked: number;
};

type StatsApiResponse = {
  success: boolean;
  source: string;
  data?: DashboardStats;
  error?: {
    message: string;
    code: string;
  };
};

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/dashboard/stats", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    const payload = await response.json() as StatsApiResponse;
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Infrastructure failure: unable to sync dashboard stats.");
    }

    return payload.data ?? {
      creators: 0,
      brands: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      blocked: 0
    };
  }
};
