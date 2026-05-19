"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { LoadingState, ErrorState, MissingTableState } from "@/app/components/ui/shared-states";
import { 
  Terminal, 
  User as UserIcon, 
  Shield, 
  Clock,
  Database,
  Globe,
  Monitor,
  Activity,
  RefreshCw
} from "lucide-react";

import { cn } from "@/app/lib/utils";
import { auditLogService, AuditLogItem } from "@/app/services/auditLogService";
import { useToast } from "@/app/hooks/useToast";

export default function AuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [missingTableInfo, setMissingTableInfo] = useState<{ isMissing: boolean; name: string; sql: string }>({ isMissing: false, name: "", sql: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setMissingTableInfo({ isMissing: false, name: "", sql: "" });
    try {
      const res = await auditLogService.getLogs();
      if (res.isMissingTable && res.tableName && res.migrationSql) {
        setMissingTableInfo({ isMissing: true, name: res.tableName, sql: res.migrationSql });
      } else {
        setLogs(res.data);
        setTotalCount(res.count);
      }
    } catch (error) {
      console.error("[AuditLogsPage] Failed to fetch logs:", error);
      setIsError(true);
      showToast("Infrastructure synchronization failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadLogs();
  }, [loadLogs]);

  const handleLiveIntel = () => {
    showToast("Live intel stream synchronized", "info");
  };

  const mutationsCount = useMemo(() => {
    return logs.filter(l => l.severity === "Critical" || l.severity === "Warning").length;
  }, [logs]);

  const columns: ColumnDef<AuditLogItem>[] = [
    {
      accessorKey: "timestamp",
      header: "Temporal Marker",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3 py-1 text-[11px] font-black text-[#F0F0FB]/40 tracking-tighter uppercase font-mono whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          <span>{row.original.timestamp}</span>
        </div>
      ),
    },
    {
      accessorKey: "admin",
      header: "Administrative Identity",
      cell: ({ row }) => (
        <div className="flex items-center space-x-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-sm flex-shrink-0">
            <UserIcon className="w-4 h-4 text-[#F0F0FB]/20" />
          </div>
          <p className="text-[14px] font-black text-[#F0F0FB] tracking-tight leading-none truncate">{row.original.admin}</p>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Executed Operation",
      cell: ({ row }) => (
        <div className="flex items-center space-x-4 min-w-0">
          <div className="p-2 rounded-xl bg-primary-blue/10 border border-primary-blue/15 shadow-sm shadow-primary-blue/5 flex-shrink-0">
            <Terminal className="w-4 h-4 text-primary-blue" />
          </div>
          <span className="text-[11px] font-black text-[#F0F0FB] uppercase tracking-widest leading-none truncate">{row.original.action}</span>
        </div>
      ),
    },
    {
      accessorKey: "target",
      header: "Strategic Target",
      cell: ({ row }) => <span className="text-[11px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.2em] whitespace-nowrap">{row.original.target}</span>,
    },
    {
      accessorKey: "severity",
      header: "Impact Assessment",
      cell: ({ row }) => (
        <div className="flex items-center whitespace-nowrap">
          <span className={cn(
            "text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border tracking-widest shadow-sm",
            row.original.severity === "Critical" ? "bg-error/10 border-error/20 text-error shadow-error/10" : 
            row.original.severity === "Warning" ? "bg-accent-orange/10 border-accent-orange/20 text-accent-orange shadow-accent-orange/10" : 
            "bg-success-green/10 border-success-green/20 text-success-green shadow-success-green/10"
          )}>
            {row.original.severity}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "ip",
      header: "Network Origin",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3 text-[11px] text-[#F0F0FB]/20 font-black font-mono tracking-tighter uppercase whitespace-nowrap">
          <Globe className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          <span>{row.original.ip}</span>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Administrative Audit Ledger" 
          subtitle="Enterprise-grade immutable registry of all administrative interactions and system mutations."
        >
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => loadLogs()}
              disabled={isLoading}
              className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-white/[0.02] border border-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Ledger</span>
            </button>
            <button 
              onClick={handleLiveIntel}
              className="flex items-center space-x-3 h-12 px-8 rounded-2xl bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
            >
              <Activity className="w-4 h-4" />
              <span>Live Intel Stream</span>
            </button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
           <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] flex items-center space-x-6 shadow-premium hover:border-primary-blue/20 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-[22px] bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20 shadow-lg shadow-primary-blue/10 group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
                 <Shield className="w-7 h-7 text-primary-blue" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F0F0FB]/20">Registry Events</p>
                 <h4 className="text-3xl font-black text-[#F0F0FB] tracking-tighter mt-1 leading-none">{totalCount.toLocaleString()}</h4>
              </div>
           </div>

           <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] flex items-center space-x-6 shadow-premium hover:border-accent-orange/20 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-[22px] bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20 shadow-lg shadow-accent-orange/10 group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
                 <Database className="w-7 h-7 text-accent-orange" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F0F0FB]/20">Protocol Mutations</p>
                 <h4 className="text-3xl font-black text-[#F0F0FB] tracking-tighter mt-1 leading-none">{mutationsCount}</h4>
              </div>
           </div>

           <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] flex items-center space-x-6 shadow-premium hover:border-success-green/20 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-[22px] bg-success-green/10 flex items-center justify-center border border-success-green/20 shadow-lg shadow-success-green/10 group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
                 <Monitor className="w-7 h-7 text-success-green" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F0F0FB]/20">Ecosystem Status</p>
                 <h4 className="text-3xl font-black text-[#F0F0FB] tracking-tighter mt-1 leading-none uppercase tracking-tight">{missingTableInfo.isMissing ? "Missing DDL" : isError ? "Degraded" : "Nominal"}</h4>
              </div>
           </div>
        </div>

        {isLoading ? (
          <LoadingState message="Synchronizing Audit Registry..." />
        ) : missingTableInfo.isMissing ? (
          <MissingTableState tableName={missingTableInfo.name} migrationSql={missingTableInfo.sql} />
        ) : isError ? (
          <ErrorState onRetry={loadLogs} />
        ) : (
          <DataTable 
            columns={columns} 
            data={logs} 
            searchKey="action"
            placeholder="Query operational registry by administrative identifier or mutation category..."
          />
        )}
      </div>
    </DashboardShell>
  );
}
