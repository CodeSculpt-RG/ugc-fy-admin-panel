import { supabase } from "@/lib/supabase/client";

export type AnalyticsPayload = {
  userGrowthData: Array<{ name: string; creators: number; brands: number }>;
  revenueData: Array<{ name: string; value: number }>;
  campaignSectors: Array<{ name: string; value: number }>;
};

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsPayload> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/analytics", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Failed to fetch analytics.");
    }

    return payload.data;
  },
};
