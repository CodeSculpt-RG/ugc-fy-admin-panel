"use client";

import React, { useState, useCallback, useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatCard } from "@/app/components/ui/core";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import { 
  Server, 
  Activity, 
  Clock, 
  Database, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Terminal,
  Zap
} from "lucide-react";
import { infrastructureService, InfrastructurePayload } from "@/app/services/infrastructureService";
import { useToast } from "@/app/hooks/useToast";

export default function InfrastructurePage() {
  const { showToast } = useToast();
  const [data, setData] = useState<InfrastructurePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await infrastructureService.getInfrastructureHealth();
      setData(res);
      showToast("Infrastructure probe completed successfully", "success");
    } catch (error) {
      console.error("[InfrastructurePage] Failed to fetch health:", error);
      setIsError(true);
      showToast("Infrastructure probe failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadHealth();
  }, [loadHealth]);

  const totalRecords = data?.tableStatuses.reduce((acc, t) => acc + t.recordsCount, 0) || 0;
  const degradedTables = data?.tableStatuses.filter(t => t.status !== "Nominal").length || 0;

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Cluster Infrastructure Health" 
          subtitle="Real-time performance telemetry, database shard density, and connection pool latency."
        >
          <button 
            onClick={() => loadHealth()}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-primary-blue text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Probe Cluster</span>
          </button>
        </PageHeader>

        {isLoading ? (
          <LoadingState message="Probing Database Nodes & Connection Pool Latency..." />
        ) : isError || !data ? (
          <ErrorState onRetry={loadHealth} />
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Connection Latency" value={`${data.latencyMs} ms`} icon={Zap} color="success" />
              <StatCard label="Cluster Uptime" value={`${data.uptimePercentage}%`} icon={Clock} color="blue" />
              <StatCard label="Total Entity Density" value={totalRecords.toLocaleString()} icon={Database} color="orange" />
              <StatCard label="Degraded Subsystems" value={degradedTables.toString()} icon={degradedTables > 0 ? AlertCircle : CheckCircle2} color={degradedTables > 0 ? "error" : "success"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Cluster Metadata */}
              <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-8 space-y-6 shadow-premium">
                <div className="flex items-center space-x-3 text-white">
                  <Server className="w-6 h-6 text-primary-blue" />
                  <h3 className="text-xl font-black tracking-tight leading-none">Node Parameters</h3>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Active Edge Shards</span>
                    <span className="text-xs font-black text-white">{data.activeNodes} Nodes</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Geographic Region</span>
                    <div className="flex items-center space-x-2 text-xs font-black text-white">
                      <Globe className="w-3.5 h-3.5 text-primary-blue" />
                      <span>{data.region}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Postgres Kernel</span>
                    <span className="text-[10px] font-mono text-white/80">{data.databaseVersion.slice(0, 30)}...</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Last Telemetry Sync</span>
                    <span className="text-[10px] font-mono text-primary-blue">{new Date(data.lastVerifiedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Table Health Matrix */}
              <div className="lg:col-span-2 bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-8 shadow-premium flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3 text-white">
                    <Database className="w-6 h-6 text-primary-blue flex-shrink-0" />
                    <h3 className="text-xl font-black tracking-tight leading-none">Database Table Shard Status</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Exact Row Density</span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 space-y-3 custom-scrollbar">
                  {data.tableStatuses.map((table) => (
                    <div key={table.tableName} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        <Terminal className="w-4 h-4 text-white/20 flex-shrink-0" />
                        <span className="text-xs font-black text-white font-mono tracking-tighter truncate">{table.tableName}</span>
                      </div>
                      <div className="flex items-center space-x-6 flex-shrink-0 ml-4">
                        <span className="text-xs font-black text-white/60 font-mono">{table.recordsCount.toLocaleString()} rows</span>
                        <div className="flex items-center space-x-2">
                          {table.status === "Nominal" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-success-green flex-shrink-0" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-success-green">Nominal</span>
                            </>
                          ) : (
                            <>
                              <Activity className="w-3.5 h-3.5 text-error animate-pulse flex-shrink-0" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-error">Degraded</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
