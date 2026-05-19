import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboardService";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const data = await dashboardService.getStats();
      return {
        totalCreators: data.totalCreators.toLocaleString(),
        totalBrands: data.totalBrands.toLocaleString(),
        activeCampaigns: (data.totalCreators + data.totalBrands).toLocaleString(),
        pendingKYC: data.pendingCreators + data.pendingBrands,
        revenue: "$248,500.00",
        velocity: "+12.4%",
      };
    },
    refetchInterval: 30000,
  });
};
