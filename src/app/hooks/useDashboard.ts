import { useQuery } from "@tanstack/react-query";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Mock stats
      return {
        totalCreators: "12,450",
        totalBrands: "840",
        activeCampaigns: "312",
        pendingKYC: "45",
        revenue: "$248,500.00",
        velocity: "+12.4%",
      };
    },
    refetchInterval: 30000,
  });
};
