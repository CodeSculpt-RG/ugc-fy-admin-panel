"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Activity,
  Settings
} from "lucide-react";
import { StatCard, StatusBadge } from "@/app/components/ui/core";
import { ChartCard } from "@/app/components/ui/chart-card";
import { AdminDonutChart, AdminBarChart } from "@/app/components/ui/charts";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { cn } from "@/app/lib/utils";
import { useToast } from "@/app/hooks/useToast";
import { dashboardService, DashboardStats } from "@/app/services/dashboardService";
import { approvalService } from "@/app/services/approvalService";
import { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { normalizeError } from "@/lib/api/normalizeError";

interface DynamicStat {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  icon: LucideIcon;
  color: "blue" | "orange" | "error" | "success";
  action: () => void;
}

export default function DashboardPage() {

  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();
  const router = useRouter();

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsError(false);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push("/admin/login", { scroll: false });
        return;
      }

      const data = await dashboardService.getStats();
      setStatsData(data);
    } catch (err: unknown) {
      const normalizedError = normalizeError(err);
      console.error("[DashboardPage] Failed to load stats:", normalizedError);
      setIsError(true);
      if (!silent) {
        showToast(normalizedError.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadStats();

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
          loadStats(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStats]);

  const handleSynchronize = async () => {
    setIsSyncing(true);
    showToast("Synchronizing with live database...", "info");
    await loadStats(true);
    setIsSyncing(false);
    showToast("Operational dashboard synchronized successfully.", "success");
  };

  const handleApproveEntity = async (id: string) => {
    setActionLoading(true);
    try {
      await approvalService.updateApprovalStatus(id, "approved");
      showToast("Entity approved successfully. Profile activated.", "success");
      await loadStats(true);
    } catch (err: unknown) {
      const normalizedError = normalizeError(err);
      showToast(`Protocol failure: ${normalizedError.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason?: string) => {
    if (!selectedRejectId) return;
    setActionLoading(true);
    try {
      await approvalService.updateApprovalStatus(selectedRejectId, "rejected", reason);
      showToast("Entity rejected. Access restricted.", "warning");
      setSelectedRejectId(null);
      await loadStats(true);
    } catch (err: unknown) {
      const normalizedError = normalizeError(err);
      showToast(`Protocol failure: ${normalizedError.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const dynamicStats: DynamicStat[] = [
    { 
      label: "Total Users", 
      value: statsData?.totalUsers?.toLocaleString() || "0", 
      trend: "LIVE", 
      up: true, 
      icon: Users, 
      color: "blue",
      action: () => router.push("/admin/users", { scroll: false })
    },
    { 
      label: "Total Creators", 
      value: statsData?.totalCreators?.toLocaleString() || "0", 
      trend: "LIVE", 
      up: true, 
      icon: Users, 
      color: "blue",
      action: () => router.push("/admin/creators", { scroll: false })
    },
    { 
      label: "Total Brands", 
      value: statsData?.totalBrands?.toLocaleString() || "0", 
      trend: "LIVE", 
      up: true, 
      icon: Building2, 
      color: "blue",
      action: () => router.push("/admin/brands", { scroll: false })
    },
    { 
      label: "Pending Approvals", 
      value: statsData?.pendingUsers?.toLocaleString() || "0", 
      trend: "QUEUE", 
      up: true, 
      icon: ShieldCheck, 
      color: "orange",
      action: () => router.push("/admin/users?status=pending_review", { scroll: false })
    },
    { 
      label: "Approved Entities", 
      value: statsData?.approvedUsers?.toLocaleString() || "0", 
      trend: "SECURE", 
      up: true, 
      icon: ShieldCheck, 
      color: "success",
      action: () => router.push("/admin/users?status=approved", { scroll: false })
    },
    { 
      label: "Rejected / Blocked", 
      value: ((statsData?.rejectedUsers ?? 0) + (statsData?.blockedUsers ?? 0)).toLocaleString(), 
      trend: "RESTRICTED", 
      up: false, 
      icon: ShieldAlert, 
      color: "error",
      action: () => router.push("/admin/users?status=rejected", { scroll: false })
    },
  ];

  const roleData = [
    { name: "Creators", count: statsData?.roleBreakdown?.creators || 0, color: "#2563EB" },
    { name: "Brands", count: statsData?.roleBreakdown?.brands || 0, color: "#10B981" },
    { name: "Admins", count: statsData?.roleBreakdown?.admins || 0, color: "#F97316" },
  ];

  const totalRoles = roleData.reduce((acc, curr) => acc + curr.count, 0);

  const approvalData = [
    { name: "Approved", count: statsData?.approvalBreakdown?.approved || 0, color: "#10B981" },
    { name: "Pending", count: statsData?.approvalBreakdown?.pending || 0, color: "#F97316" },
    { name: "Rejected", count: statsData?.approvalBreakdown?.rejected || 0, color: "#EF4444" },
    { name: "Blocked", count: statsData?.approvalBreakdown?.blocked || 0, color: "#9CA3AF" },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary to-accent-hover text-white rounded-[32px] p-10 md:p-14 mb-10 shadow-glow relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="space-y-4 relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Welcome back, Admin 👋
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-xl">
              Here is what&apos;s happening with your UGC-FY marketplace today. Monitor active campaigns, creator approvals, and platform revenue.
            </p>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <button
              onClick={handleSynchronize}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing ? "animate-spin" : "")} />
              <span>{isSyncing ? "Syncing..." : "Sync Data"}</span>
            </button>
            <button
              onClick={() => router.push("/admin/settings", { scroll: false })}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-white text-primary font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* System Health Banner */}
        {statsData && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 rounded-full bg-foreground text-background border border-border mb-10 shadow-sm gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">System Live & Connected</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-[11px] font-bold uppercase tracking-widest">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 opacity-70" />
                <span>Supabase: Healthy</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 opacity-70" />
                <span>API Status: Normal</span>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20">Synchronizing Intelligence Ledger...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="p-6 rounded-[32px] bg-error/10 border border-error/20 text-error">
               <AlertCircle className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-black text-foreground">Infrastructure Desync</p>
              <p className="text-sm text-foreground/40">Unable to establish a secure handshake with the administrative API.</p>
            </div>
            <button 
              onClick={() => loadStats()}
              className="h-12 px-8 rounded-2xl bg-surface-elevated border border-border text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:border-primary transition-all active:scale-95"
            >
              Retry Handshake
            </button>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="dashboard-grid">
              {dynamicStats.map((stat, i) => (
                <StatCard 
                  key={stat.label}
                  {...stat}
                  delay={i * 0.1}
                  color={stat.color}
                  onClick={stat.action}
                />
              ))}
            </div>
          </>
        )}

        {/* Charts Section */}
        {statsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
            <ChartCard 
              title="Ecosystem Role Split" 
              subtitle="Distribution of registered entities"
            >
              <div className="mt-8">
                {totalRoles === 0 ? (
                  <div className="h-[240px] flex items-center justify-center text-foreground/40 text-sm font-semibold">
                    No user data available yet.
                  </div>
                ) : (
                  <AdminDonutChart data={roleData} height={240} />
                )}
              </div>
            </ChartCard>

            <ChartCard 
              title="Approval Breakdown" 
              subtitle="Moderation status across all accounts"
            >
              <div className="mt-8">
                <AdminBarChart data={approvalData} xKey="name" yKey="count" color="#ff6a00" height={240} />
              </div>
            </ChartCard>
          </div>
        )}

        {/* Lower Grid */}
        {statsData && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10">
            {/* Activity Feed / Recent Signups */}
            <div className="xl:col-span-2 bg-card-bg border border-border rounded-[28px] p-10 shadow-sm relative overflow-hidden group interactive-card">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">Recent Registrations</h3>
                  <p className="stat-label">Live entity onboarding stream</p>
                </div>
                <button 
                  onClick={() => router.push("/admin/users", { scroll: false })}
                  className="px-6 py-3 rounded-2xl bg-surface-elevated border border-border text-[10px] font-black text-foreground/40 hover:bg-white hover:text-black transition-all flex items-center space-x-3 uppercase tracking-widest group/btn shadow-sm"
                >
                  <span>View All Users</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="space-y-4">
                {statsData.recentUsers.length === 0 ? (
                  <p className="text-center py-12 text-foreground/20 text-xs font-black uppercase tracking-widest">No recent entities found in ledger.</p>
                ) : (
                  statsData.recentUsers.map((user) => (
                    <div 
                      key={user.id} 
                      onClick={() => router.push("/admin/users", { scroll: false })}
                      className="flex items-center space-x-6 p-6 rounded-[28px] bg-surface-elevated border border-border hover:border-primary/20 hover:bg-surface-elevated hover:bg-foreground/5 transition-all duration-500 group/item shadow-sm cursor-pointer relative overflow-hidden"
                    >
                      <div className="p-4 rounded-2xl bg-surface-elevated border border-border flex-shrink-0 group-hover/item:bg-primary/10 transition-colors">
                        <Clock className="w-5 h-5 text-foreground/15 group-hover/item:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-base font-black text-foreground tracking-tight">{user.email || user.id}</p>
                          <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider">{user.role}</span>
                          <span className="text-foreground/20">•</span>
                          <span className="text-xs text-foreground/40 font-semibold">{user.profile_completed ? "Profile Complete" : "Profile Incomplete"}</span>
                        </div>
                      </div>
                      <StatusBadge 
                        status={user.approval_status} 
                        variant={user.approval_status === "approved" ? "success" : user.approval_status === "pending_review" ? "warning" : "error"} 
                        className="hidden lg:inline-flex"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-10">
              {/* Policy Guard / Pending Queue */}
              <div className="bg-card-bg border border-border rounded-[28px] p-10 shadow-sm interactive-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-warning/20 to-transparent" />
                
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-foreground tracking-tighter">Approval Queue</h3>
                    <p className="stat-label">Pending verification</p>
                  </div>
                  <button 
                    onClick={() => router.push("/admin/users?status=pending_review", { scroll: false })}
                    className="p-3.5 rounded-xl bg-accent-orange/10 border border-accent-orange/20 shadow-lg shadow-accent-orange/10 hover:bg-accent-orange/20 transition-all"
                  >
                    <ArrowRight className="w-5 h-5 text-accent-orange stroke-[2.5]" />
                  </button>
                </div>

                <div className="space-y-6">
                  {statsData.pendingApprovalQueue.length === 0 ? (
                    <p className="text-center py-10 text-foreground/20 text-xs font-black uppercase tracking-widest">Approval queue is empty.</p>
                  ) : (
                    statsData.pendingApprovalQueue.map((item) => (
                      <div key={item.id} className="space-y-4 group/mod p-5 rounded-2xl bg-surface-elevated border border-border hover:border-border transition-all shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-foreground truncate tracking-tight">{item.email || item.id}</p>
                            <p className="text-[10px] text-primary uppercase font-black tracking-widest mt-1">{item.role}</p>
                          </div>
                          <StatusBadge status="Pending" variant="warning" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button 
                            onClick={() => handleApproveEntity(item.id)}
                            disabled={actionLoading}
                            className="py-3 rounded-2xl bg-success-green text-white text-[10px] font-black uppercase tracking-widest hover:bg-success-green/90 transition-all shadow-lg shadow-success-green/20 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button 
                            onClick={() => setSelectedRejectId(item.id)}
                            disabled={actionLoading}
                            className="py-3 rounded-2xl bg-surface-elevated border border-border text-foreground/60 text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white hover:border-error transition-all active:scale-95 shadow-sm disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!selectedRejectId}
        onClose={() => setSelectedRejectId(null)}
        onConfirm={(reason) => handleRejectConfirm(reason)}
        title="Restrict Entity Access"
        description="Are you sure you want to reject this profile? They will be unable to access platform resources."
        variant="danger"
        confirmText="Confirm Rejection"
        showInput={true}
        loading={actionLoading}
      />
    </DashboardShell>
  );
}
