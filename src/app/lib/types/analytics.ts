export type AnalyticsPoint = {
  date: string;
  value: number;
};

export type AnalyticsHighLow = {
  date: string;
  value: number;
};

export type DashboardAnalytics = {
  summary: {
    totalUsers: number;
    totalCreators: number;
    totalBrands: number;
    activeCampaigns: number;
    pendingApprovals: number;
    totalRevenue: number;
    monthlyRevenue: number;
    moderationQueue: number;
  };
  timeseries: {
    users: AnalyticsPoint[];
    creators: AnalyticsPoint[];
    brands: AnalyticsPoint[];
    campaigns: AnalyticsPoint[];
    revenue: AnalyticsPoint[];
    approvals: AnalyticsPoint[];
    moderation: AnalyticsPoint[];
  };
  highsLows: {
    revenueHigh: AnalyticsHighLow | null;
    revenueLow: AnalyticsHighLow | null;
    usersHigh: AnalyticsHighLow | null;
    usersLow: AnalyticsHighLow | null;
    campaignsHigh: AnalyticsHighLow | null;
    campaignsLow: AnalyticsHighLow | null;
  };
  meta: {
    partial: boolean;
    missingTables: string[];
    missingColumns: string[];
    emptySources: string[];
    generatedAt: string;
    rangeDays: number;
  };
};
