"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

import DashboardShell from "@/app/components/layout/DashboardShell";
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  RefreshCw,
  Database,
  Activity,
  Info
} from "lucide-react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { MetricTile } from "@/app/components/shared/MetricTile";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { SectionHeader } from "@/app/components/shared/SectionHeader";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { useToast } from "@/app/hooks/useToast";
import { isAbortError } from "@/app/services/adminApiClient";
import { dashboardService, DashboardStats } from "@/app/services/dashboardService";
import { supabase } from "@/lib/supabase/client";
import { normalizeError } from "@/lib/api/normalizeError";
import { AnalyticsAreaChart } from "@/app/components/dashboard/AnalyticsAreaChart";
import { AnalyticsBarChart } from "@/app/components/dashboard/AnalyticsBarChart";
import { AnalyticsLineChart } from "@/app/components/dashboard/AnalyticsLineChart";
import { HighLowCard } from "@/app/components/dashboard/HighLowCard";
import { RangeSelector } from "@/app/components/dashboard/RangeSelector";

type RangeOption = "7d" | "30d" | "90d";



type AnalyticsData = {
  summary: Record<string, number>;
  timeseries: Record<string, { date: string; value: number }[]>;
  highsLows: Record<string, { date: string; value: number } | null>;
  meta: {
    partial: boolean;
    missingTables: string[];
    generatedAt: string;
    rangeDays: number;
  };
};

export default function DashboardPage() {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState<RangeOption>("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isError, setIsError] = useState(false);

  const { showToast } = useToast();
  const realtimeRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = useCallback(async (silent = false, signal?: AbortSignal) => {
    if (!silent) setIsLoading(true);
    setIsError(false);
    try {
      const [stats, analyticsRes] = await Promise.all([
        dashboardService.getStats(signal),
        fetch(`/api/admin/dashboard/analytics?range=${range}`, { signal }).then(r => r.json())
      ]);
      setStatsData(stats);
      if (analyticsRes.success) {
        setAnalyticsData(analyticsRes.data);
      }
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      const normalizedError = normalizeError(err);
      setIsError(true);
      if (!silent) {
        showToast(normalizedError.message, "error");
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [showToast, range]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadDashboard(false, controller.signal);
      }
    });

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          if (realtimeRefreshRef.current) {
            clearTimeout(realtimeRefreshRef.current);
          }
          realtimeRefreshRef.current = setTimeout(() => {
            void loadDashboard(true);
          }, 750);
        }
      )
      .subscribe();

    return () => {
      controller.abort();
      if (realtimeRefreshRef.current) {
        clearTimeout(realtimeRefreshRef.current);
        realtimeRefreshRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  const handleSynchronize = async () => {
    setIsSyncing(true);
    showToast("Synchronizing with live database...", "info");
    await loadDashboard(true);
    setIsSyncing(false);
    showToast("Operational dashboard synchronized successfully.", "success");
  };

  const handleRangeChange = (newRange: RangeOption) => {
    setRange(newRange);
  };

  return (
    <DashboardShell>
      <div className="section-spacing">
        
        {/* Main Dashboard Canvas */}
        <section className="rounded-[36px] border border-white/70 bg-white/55 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6 lg:p-8">
          
          <CommandHeader 
            eyebrow="Creator economy operations"
            title="UGCFY Command Center"
            description="Monitor creators, brands, campaigns, verification, moderation, finance, and support from one workspace."
            actions={
              <div className="flex items-center gap-4">
                <RangeSelector currentRange={range} onRangeChange={handleRangeChange} />
                <button
                  onClick={handleSynchronize}
                  disabled={isSyncing}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-black/10 transition-all hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  Sync Data
                </button>
              </div>
            }
            statusChips={
              statsData && (
                <>
                  <StatusPill label="System Live" variant="live" />
                  <StatusPill label="API Normal" variant="live" />
                </>
              )
            }
          />

          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">Loading operational data...</div>
          ) : isError ? (
            <ErrorState 
              title="Infrastructure Desync" 
              description="Unable to establish a secure handshake with the administrative API." 
              actionLabel="Retry Handshake" 
              onAction={() => loadDashboard()} 
              className="my-8"
            />
          ) : (
            <div className="mt-8 space-y-10">
              
              {analyticsData?.meta?.partial && (
                <div className="flex items-start gap-3 rounded-[24px] border border-amber-500/15 bg-amber-50/75 p-4 text-amber-900 shadow-sm backdrop-blur-xl">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold">Some analytics are partial because optional data tables are not available yet.</p>
                    <p className="mt-1 text-sm leading-6 text-amber-800/80">
                      Missing: {analyticsData.meta.missingTables.join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Operational Signals */}
              <div>
                <SectionHeader title="Operational Signals" description="Global platform metrics" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <MetricTile 
                    label="Total Users" 
                    value={analyticsData?.summary?.totalUsers?.toLocaleString() || "0"} 
                    icon={<Users />} 
                    status={<StatusPill label="Live" variant="live" dot={false} />}
                  />
                  <MetricTile 
                    label="Creators" 
                    value={analyticsData?.summary?.totalCreators?.toLocaleString() || "0"} 
                    icon={<Users />} 
                    status={<StatusPill label="Live" variant="live" dot={false} />}
                  />
                  <MetricTile 
                    label="Brands" 
                    value={analyticsData?.summary?.totalBrands?.toLocaleString() || "0"} 
                    icon={<Building2 />} 
                    status={<StatusPill label="Live" variant="live" dot={false} />}
                  />
                  <MetricTile 
                    label="Active Campaigns" 
                    value={analyticsData?.summary?.activeCampaigns?.toLocaleString() || "0"} 
                    icon={<Activity />} 
                    status={<StatusPill label="Queue" variant="queue" dot={false} />}
                  />
                  <MetricTile 
                    label="Pending Approvals" 
                    value={analyticsData?.summary?.pendingApprovals?.toLocaleString() || "0"} 
                    icon={<ShieldCheck />} 
                    status={<StatusPill label="Secure" variant="success" dot={false} />}
                  />
                  <MetricTile 
                    label="Revenue" 
                    value={`₹${analyticsData?.summary?.totalRevenue?.toLocaleString() || "0"}`} 
                    icon={<Database />} 
                    status={<StatusPill label="Restricted" variant="danger" dot={false} />}
                  />
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                  <SectionHeader title="Platform Growth" description="User, creator, and brand acquisition" />
                  <AnalyticsAreaChart 
                    data={analyticsData?.timeseries?.users || []} 
                    dataKeys={["value"]} 
                    colors={["#3b82f6"]} 
                    emptyTitle="No Platform Growth Data"
                    emptyDescription="User growth will appear once profiles are created."
                  />
                </div>

                <div>
                  <SectionHeader title="Revenue / Income" description="Platform transactions over time" />
                  <AnalyticsBarChart 
                    data={analyticsData?.timeseries?.revenue || []} 
                    dataKeys={["value"]} 
                    colors={["#10b981"]} 
                    emptyTitle="No Revenue Data"
                    emptyDescription="Revenue data will appear once verified payment records are available."
                  />
                </div>

                <div>
                  <SectionHeader title="Campaign Activity" description="Campaign creation and engagement" />
                  <AnalyticsLineChart 
                    data={analyticsData?.timeseries?.campaigns || []} 
                    dataKeys={["value"]} 
                    colors={["#f97316"]} 
                    emptyTitle="No Campaign Data"
                    emptyDescription="Campaign activity will appear once campaigns are created."
                  />
                </div>

                <div>
                  <SectionHeader title="Approval Flow" description="Pending and processed entity approvals" />
                  <AnalyticsAreaChart 
                    data={analyticsData?.timeseries?.approvals || []} 
                    dataKeys={["value"]} 
                    colors={["#8b5cf6"]} 
                    emptyTitle="No Approval Data"
                    emptyDescription="Approval trends will appear once verification records are available."
                  />
                </div>
              </div>

              {/* Highs & Lows */}
              <div>
                <SectionHeader title="Highs & Lows" description="Critical pivot points over the period" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <HighLowCard 
                    title="Revenue" 
                    highValue={analyticsData?.highsLows?.revenueHigh?.value || null} 
                    highDate={analyticsData?.highsLows?.revenueHigh?.date || null} 
                    lowValue={analyticsData?.highsLows?.revenueLow?.value || null} 
                    lowDate={analyticsData?.highsLows?.revenueLow?.date || null} 
                    formatValue={(val) => `₹${val.toLocaleString()}`}
                  />
                  <HighLowCard 
                    title="User Growth" 
                    highValue={analyticsData?.highsLows?.usersHigh?.value || null} 
                    highDate={analyticsData?.highsLows?.usersHigh?.date || null} 
                    lowValue={analyticsData?.highsLows?.usersLow?.value || null} 
                    lowDate={analyticsData?.highsLows?.usersLow?.date || null} 
                  />
                  <HighLowCard 
                    title="Campaigns" 
                    highValue={analyticsData?.highsLows?.campaignsHigh?.value || null} 
                    highDate={analyticsData?.highsLows?.campaignsHigh?.date || null} 
                    lowValue={analyticsData?.highsLows?.campaignsLow?.value || null} 
                    lowDate={analyticsData?.highsLows?.campaignsLow?.date || null} 
                  />
                </div>
              </div>

            </div>
          )}
        </section>

      </div>
    </DashboardShell>
  );
}
