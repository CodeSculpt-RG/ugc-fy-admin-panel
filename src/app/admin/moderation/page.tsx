"use client";

import React, { useState, useCallback, useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ThumbsUp, 
  ThumbsDown, 
  Flag,
  Clock,
  User,
  Play,
  RefreshCw
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/core";
import { LoadingState, ErrorState, MissingTableState } from "@/app/components/ui/shared-states";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { ModerationItem } from "@/app/types";
import { moderationService } from "@/app/services/moderationService";
import { useToast } from "@/app/hooks/useToast";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { useAdminAuth } from "@/app/context/AdminAuthContext";

export default function ModerationPage() {
  const { hasPermission } = useAdminAuth();
  const [filter, setFilter] = useState("All Items");
  const { showToast } = useToast();
  const [localItems, setLocalItems] = useState<ModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [missingTableInfo, setMissingTableInfo] = useState<{ isMissing: boolean; name: string; sql: string }>({ isMissing: false, name: "", sql: "" });

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setMissingTableInfo({ isMissing: false, name: "", sql: "" });
    try {
      const data = await moderationService.getQueue();
      if (data.isMissingTable && data.tableName && data.migrationSql) {
        setMissingTableInfo({ isMissing: true, name: data.tableName, sql: data.migrationSql });
      } else {
        setLocalItems(data.data);
      }
    } catch (error) {
      console.error("[ModerationPage] Failed to fetch queue:", error);
      setIsError(true);
      showToast("Infrastructure synchronization failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadQueue();
  }, [loadQueue]);

  const filteredItems = localItems.filter(item => 
    filter === "All Items" || item.status === filter
  );

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await moderationService.resolveCase(id, "Dismissed", "Cleared by administrative protocol");
      showToast(`Asset ${id.slice(0, 8)} cleared successfully`, "success");
      setLocalItems(prev => prev.filter(item => item.id !== id));
    } catch {
      showToast("Approval protocol failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await moderationService.resolveCase(id, "Restricted", "Content violates platform guidelines");
      showToast(`Asset ${id.slice(0, 8)} restricted`, "warning");
      setLocalItems(prev => prev.filter(item => item.id !== id));
    } catch {
      showToast("Rejection protocol failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEscalate = async (id: string) => {
    setActionLoading(id);
    try {
      await moderationService.resolveCase(id, "Pending Review", "Incident escalated for senior review");
      showToast(`Incident ${id.slice(0, 8)} escalated`, "info");
      await loadQueue();
    } catch {
      showToast("Escalation protocol failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const clearedCount = localItems.filter(i => i.status === "Dismissed" || i.status === "Resolved").length;
  const flaggedCount = localItems.filter(i => i.status === "AI Flagged" || i.status === "User Reported" || i.status === "Pending Review").length;

  return (
    <ProtectedRoute permission="moderation.read">
      <DashboardShell>
      <div className="section-spacing">
        {/* Header */}
        <PageHeader 
          title="Security Protocols" 
          subtitle="Enterprise-grade moderation of platform assets and ecosystem interactions."
        >
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-6 p-2.5 bg-surface border border-border rounded-[24px] shadow-inner">
               <div className="flex items-center space-x-3 px-4 border-r border-border">
                  <ShieldCheck className="w-4 h-4 text-success-green" />
                  <span className="text-[11px] font-black text-foreground/40 uppercase tracking-widest">{clearedCount} Cleared</span>
               </div>
               <div className="flex items-center space-x-3 px-4">
                  <ShieldAlert className="w-4 h-4 text-error" />
                  <span className="text-[11px] font-black text-foreground/40 uppercase tracking-widest">{flaggedCount} Flagged</span>
               </div>
            </div>

            <button 
              onClick={() => loadQueue()}
              disabled={isLoading}
              className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Queue</span>
            </button>
          </div>
        </PageHeader>

        {/* Filters */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-6 scrollbar-hide">
          {["All Items", "AI Flagged", "User Reported", "Pending Review", "Restricted", "Resolved", "Dismissed"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                filter === tab 
                  ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                  : "bg-surface border-border text-foreground/30 hover:text-foreground hover:bg-surface-elevated hover:bg-foreground/5"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <LoadingState message="Synchronizing Asset Ledger..." />
        ) : missingTableInfo.isMissing ? (
          <MissingTableState tableName={missingTableInfo.name} migrationSql={missingTableInfo.sql} />
        ) : isError ? (
          <ErrorState onRetry={loadQueue} />
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-[40px] border border-border p-12 shadow-premium">
            <span className="text-xs font-black uppercase tracking-[0.4em] text-foreground/40">No moderation cases found.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card-bg border border-border rounded-[32px] overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-premium interactive-card flex flex-col relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Media Preview */}
                <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center shrink-0">
                  {item.type === "Video" ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60" />
                      <div className="z-20 w-14 h-14 rounded-full bg-foreground/10 backdrop-blur-xl border border-border flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      </div>
                      <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-background/40 backdrop-blur-md border border-border text-[9px] font-black text-white uppercase tracking-widest">
                        {item.type}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center italic text-foreground/40 text-xs font-medium leading-relaxed">
                      &quot;{item.content || item.title}&quot;
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-8 space-y-6 flex-1 flex flex-col min-w-0">
                  <div className="flex justify-between items-start gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-foreground truncate tracking-tight">{item.title}</h3>
                      <p className="text-[9px] text-foreground/20 uppercase font-black tracking-widest mt-1.5 truncate">{item.campaign}</p>
                    </div>

                    <div className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0",
                      item.risk === "High" ? "bg-error/10 text-error border-error/20" : 
                      item.risk === "Medium" ? "bg-warning/10 text-warning border-warning/20" : 
                      "bg-success-green/10 text-success-green border-success-green/20"
                    )}>
                      {item.risk} Risk
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 rounded-2xl bg-surface-elevated border border-border shadow-sm min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-foreground truncate tracking-tight">{item.creator}</p>
                      <p className="text-[9px] text-foreground/20 font-black uppercase tracking-widest mt-0.5 truncate">Entity Profile</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2 text-foreground/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{item.timestamp}</span>
                    </div>

                    <div className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      item.status === "AI Flagged" ? "text-error" : 
                      item.status === "Restricted" ? "text-error" : "text-warning"
                    )}>
                      {item.status}
                    </div>
                  </div>

                  <div className="mt-auto space-y-4 pt-6">
                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleApprove(item.id)}
                        disabled={actionLoading === item.id || !hasPermission("moderation.write")}
                        className="flex items-center justify-center space-x-2 bg-primary text-white hover:bg-primary/90 py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 outline-none"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>
                      <button 
                        onClick={() => handleReject(item.id)}
                        disabled={actionLoading === item.id || !hasPermission("moderation.write")}
                        className="flex items-center justify-center space-x-2 bg-surface-elevated border border-border text-foreground/40 hover:bg-error hover:text-white hover:border-error py-3.5 rounded-2xl transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm disabled:opacity-50 outline-none"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Restrict</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => handleEscalate(item.id)}
                      disabled={actionLoading === item.id || !hasPermission("moderation.write")}
                      className="w-full flex items-center justify-center space-x-2 bg-surface-elevated border border-border text-foreground/30 hover:text-foreground py-3.5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest group shadow-sm disabled:opacity-50 outline-none"
                    >
                      <Flag className="w-3.5 h-3.5 group-hover:text-error transition-colors" />
                      <span>Escalate Incident</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
    </ProtectedRoute>
  );
}
