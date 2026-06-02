import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboardService";
import { useAdminAuthOptional } from "@/app/context/AdminAuthContext";

export const useDashboardStats = () => {
  const auth = useAdminAuthOptional();

  return useQuery({
    queryKey: ["dashboard-stats"],
    enabled: Boolean(auth?.session?.access_token),
    queryFn: async ({ signal }) => {
      const data = await dashboardService.getStats(signal);
      return {
        totalCreators: data.totalCreators.toLocaleString(),
        totalBrands: data.totalBrands.toLocaleString(),
        activeCampaigns: (data.totalCreators + data.totalBrands).toLocaleString(),
        pendingKYC: data.pendingCreators + data.pendingBrands,
        revenue: "$248,500.00",
        velocity: "+12.4%",
      };
    },
    staleTime: 120000,
    refetchInterval: 120000,
    refetchIntervalInBackground: false,
  });
};
