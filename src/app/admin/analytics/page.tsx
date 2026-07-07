/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { ChartCard } from "@/app/components/ui/chart-card";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, Filter, RefreshCw } from "lucide-react";
export interface AnalyticsPayload {
  userGrowthData: any[];
  revenueData: any[];
  campaignSectors: any[];
}
const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsPayload> => ({ userGrowthData: [], revenueData: [], campaignSectors: [] })
};
import { useToast } from "@/app/hooks/useToast";

const COLORS = ["#2563EB", "#F97316", "#F0F0FB", "#6366F1", "#EC4899", "#10B981", "#8B5CF6"];
const responsiveChartProps = {
  width: "100%",
  height: "100%",
  minWidth: 100,
  minHeight: 100,
} as const;

export default function AnalyticsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await analyticsService.getAnalytics();
      setData(res);
    } catch (error) {
      console.error("[AnalyticsPage] Failed to load analytics:", error);
      setIsError(true);
      showToast("Infrastructure synchronization failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadAnalytics();
  }, [loadAnalytics]);

  const handleSyncIntelligence = async () => {
    await loadAnalytics();
  };

  const handleConfigureVectors = () => {
    setShowFilters((prev) => !prev);
  };

  const handleExportProtocol = () => {
    if (!data || (!data.userGrowthData.length && !data.revenueData.length && !data.campaignSectors.length)) {
      showToast("No analytics data available to export.", "error");
      return;
    }

    const items = data.userGrowthData;
    if (!items.length) {
      showToast("No growth vectors available for export.", "warning");
      return;
    }

    const headers = Object.keys(items[0]);
    const csvRows = [
      headers.join(","),
      ...items.map((item: any) =>
        headers
          .map((header) => JSON.stringify(String(item[header as keyof typeof item] ?? "")))
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "export-protocol.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Analytics protocol exported successfully", "success");
  };

  const growthData = data?.userGrowthData || [];
  const revData = data?.revenueData || [];
  const sectors = data?.campaignSectors || [];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Intelligence Infrastructure" 
          subtitle="Forensic analysis of platform growth vectors, fiscal yields, and ecosystem dynamics."
        >
          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleSyncIntelligence}
              disabled={isLoading}
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-primary text-white px-6 text-xs font-bold uppercase tracking-[0.18em] hover:bg-primary/90 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={"h-4 w-4 shrink-0 " + (isLoading ? "animate-spin" : "")} />
              <span className="leading-none">Sync Intelligence</span>
            </button>

            <button
              type="button"
              onClick={handleConfigureVectors}
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-surface-elevated border border-border text-foreground px-6 text-xs font-bold uppercase tracking-[0.18em] hover:bg-white hover:text-black active:scale-95 transition-all shadow-sm"
            >
              <Filter className="h-4 w-4 shrink-0" />
              <span className="leading-none">Configure Vectors</span>
            </button>

            <button
              type="button"
              onClick={handleExportProtocol}
              className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-primary text-white px-6 text-xs font-bold uppercase tracking-[0.18em] hover:bg-primary/90 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="leading-none">Export Protocol</span>
            </button>
          </div>
        </PageHeader>

        {showFilters && (
          <div className="mb-8 p-6 rounded-[28px] bg-card-bg border border-border shadow-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest text-white">Active Vector Configuration</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-foreground/70">
              <span className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-foreground/5 border border-border">Timeframe: Last 6 Months</span>
              <span className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-foreground/5 border border-border">Entity Target: All Sectors</span>
              <span className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-foreground/5 border border-border">Yield Base: USD</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingState message="Synchronizing Intelligence Vectors..." />
        ) : isError || !data ? (
          <ErrorState onRetry={loadAnalytics} />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
              <ChartCard title="Entity Acquisition" subtitle="Entity growth lifecycle analysis (Creators vs Corporate)">
                <div className="h-[320px] min-h-[320px] w-full min-w-0 pt-8">
                  <ResponsiveContainer {...responsiveChartProps}>
                    <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCreators" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBrands" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} />

                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111827', 
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '24px',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                          padding: '16px'
                        }} 
                        labelStyle={{ fontWeight: 900, marginBottom: '8px', color: '#F0F0FB' }}
                        itemStyle={{ color: '#F0F0FB' }}
                      />

                      <Area type="monotone" dataKey="creators" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorCreators)" />
                      <Area type="monotone" dataKey="brands" stroke="#F97316" strokeWidth={4} fillOpacity={1} fill="url(#colorBrands)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Revenue Yield (GMV)" subtitle="Weekly transaction volume and platform yield metrics">
                <div className="h-[320px] min-h-[320px] w-full min-w-0 pt-8">
                  <ResponsiveContainer {...responsiveChartProps}>
                    <BarChart data={revData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} />

                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                        contentStyle={{ 
                          backgroundColor: '#111827', 
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '24px',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                          padding: '16px'
                        }} 
                        itemStyle={{ color: '#F0F0FB' }}
                      />
                      <Bar dataKey="value" fill="#2563EB" radius={[12, 12, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <ChartCard title="Sector Distribution" subtitle="Ecosystem segmentation by industry vector" className="lg:col-span-1">
                <div className="h-[320px] min-h-[320px] w-full min-w-0 pt-4">
                  <ResponsiveContainer {...responsiveChartProps}>
                    <PieChart>
                      <Pie
                        data={sectors}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {sectors.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111827', 
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '24px',
                          padding: '12px'
                        }} 
                        itemStyle={{ color: '#F0F0FB' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {sectors.map((sector: any, i: number) => (
                      <div key={sector.name} className="flex items-center justify-between p-3 rounded-2xl bg-surface-elevated border border-border shadow-sm truncate">
                        <div className="flex items-center space-x-2 truncate">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 truncate">{sector.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-foreground flex-shrink-0 ml-1">{sector.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="Retention Dynamics" subtitle="Temporal user behavior and active engagement analysis" className="lg:col-span-2">
                <div className="h-[320px] min-h-[320px] w-full min-w-0 pt-8">
                  <ResponsiveContainer {...responsiveChartProps}>
                    <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} />

                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111827', 
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '24px',
                          padding: '16px'
                        }} 
                        itemStyle={{ color: '#F0F0FB' }}
                      />

                      <Line type="monotone" dataKey="creators" stroke="#2563EB" strokeWidth={5} dot={{ r: 6, fill: '#2563EB', strokeWidth: 3, stroke: '#111827' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="brands" stroke="#F97316" strokeWidth={5} dot={{ r: 6, fill: '#F97316', strokeWidth: 3, stroke: '#111827' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
