"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  TrendingUp, 
  Clock,
  ShieldAlert,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { StatCard, PageHeader, StatusBadge } from "@/app/components/ui/core";
import { ChartCard } from "@/app/components/ui/chart-card";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { cn } from "@/app/lib/utils";




const revenueData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 4500 },
  { name: "May", value: 6000 },
  { name: "Jun", value: 5500 },
  { name: "Jul", value: 7000 },
];

const activityData = [
  { name: "Mon", count: 120 },
  { name: "Tue", count: 150 },
  { name: "Wed", count: 180 },
  { name: "Thu", count: 140 },
  { name: "Fri", count: 210 },
  { name: "Sat", count: 190 },
  { name: "Sun", count: 160 },
];

const recentActivity = [
  { id: 1, type: "Payout", user: "Alex Rivera", action: "Requested a payout of $1,200", time: "12m ago", status: "pending" },
  { id: 2, type: "Campaign", user: "Nike Global", action: "Launched 'Summer Vibes' campaign", time: "45m ago", status: "active" },
  { id: 3, type: "Dispute", user: "Marcus Thorne", action: "Opened a dispute for Campaign #402", time: "2h ago", status: "high" },
  { id: 4, type: "KYC", user: "Elena Gomez", action: "Submitted verification documents", time: "5h ago", status: "info" },
];

const moderationSnapshot = [
  { id: 1, type: "Video", title: "Unboxing SuperPhone 15", creator: "Alex Rivera", risk: "Medium" },
  { id: 2, type: "Comment", title: "Response to Brand", creator: "Sarah Chen", risk: "High" },
  { id: 3, type: "Bio", title: "Creator Profile Update", creator: "Marcus Thorne", risk: "Low" },
];

const paymentAlerts = [
  { id: 1, type: "Escrow Timeout", amount: "$500", brand: "Urban Threads", time: "1h ago" },
  { id: 2, type: "Failed Payout", amount: "$1,200", creator: "Alex Rivera", time: "3h ago" },
  { id: 3, type: "Large Transaction", amount: "$5,000", brand: "GymShark", time: "5h ago" },
];

import { useToast } from "@/app/hooks/useToast";
import { dashboardService, DashboardStats } from "@/app/services/dashboardService";
import { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface DynamicStat {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  icon: LucideIcon;
  color: "blue" | "orange" | "error" | "success";
}


export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("24h");
  const [selectedStat, setSelectedStat] = useState<DynamicStat | null>(null);
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();

  const router = useRouter();

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
        return;
      }

      const data = await dashboardService.getStats();
      setStatsData(data);
    } catch (err) {
      console.error("[DashboardPage] Failed to load stats:", err);
      setIsError(true);
      showToast("Failed to synchronize operational intelligence.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    const synchronize = async () => {
      await loadStats();
    };
    synchronize();
  }, [loadStats]);

  const handleApprove = (id: number) => {
    showToast(`Moderation asset ${id} approved`, "success");
  };

  const handleReject = (id: number) => {
    showToast(`Moderation asset ${id} rejected`, "warning");
  };

  const handleExport = () => {
    showToast("Intelligence export authorized", "success");
  };

  const dynamicStats: DynamicStat[] = [
    { label: "Total Creators", value: statsData?.creators?.toLocaleString() || "0", trend: "+12%", up: true, icon: Users, color: "blue" },
    { label: "Total Brands", value: statsData?.brands?.toLocaleString() || "0", trend: "+5%", up: true, icon: Building2, color: "blue" },
    { label: "Pending Approvals", value: statsData?.pending?.toLocaleString() || "0", trend: "NEW", up: true, icon: ShieldCheck, color: "orange" },
    { label: "Approved Users", value: statsData?.approved?.toLocaleString() || "0", trend: "+18%", up: true, icon: ShieldCheck, color: "blue" },
    { label: "Rejected Entities", value: statsData?.rejected?.toLocaleString() || "0", trend: "-2%", up: false, icon: AlertCircle, color: "orange" },
    { label: "Restricted Access", value: statsData?.blocked?.toLocaleString() || "0", trend: "ALERT", up: false, icon: ShieldAlert, color: "orange" },
  ];


  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Operational Intel" 
          subtitle="Enterprise-grade ecosystem monitoring and infrastructure analytics."
        >
          <div className="flex p-1.5 bg-[#111827] border border-white/[0.08] rounded-[22px] overflow-hidden shadow-inner">
            {['24h', '7d', '30d', '12m'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  tab === activeTab 
                    ? "bg-primary-blue text-white shadow-lg shadow-primary-blue/20" 
                    : "text-[#F0F0FB]/20 hover:text-[#F0F0FB]/40"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </PageHeader>


        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F0F0FB]/20">Synchronizing Intelligence Ledger...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="p-6 rounded-[32px] bg-error/10 border border-error/20 text-error">
               <AlertCircle className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-black text-[#F0F0FB]">Infrastructure Desync</p>
              <p className="text-sm text-[#F0F0FB]/40">Unable to establish a secure handshake with the administrative API.</p>
            </div>
            <button 
              onClick={() => loadStats()}
              className="h-12 px-8 rounded-2xl bg-white/[0.03] border border-white/10 text-[#F0F0FB] text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue hover:border-primary-blue transition-all active:scale-95"
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
                  onClick={() => setSelectedStat(stat)}
                />
              ))}
            </div>
          </>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ChartCard 
            title="Revenue Velocity" 
            subtitle="Real-time monetization vectors"
            headerAction={
              <div className="text-right">
                <p className="text-4xl font-black text-[#F0F0FB] tracking-tighter">$248,500.00</p>
                <div className="flex items-center justify-end space-x-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-green shadow-sm animate-pulse" />
                  <p className="text-[10px] text-success-green font-black uppercase tracking-widest">+12.4% VELOCITY</p>
                </div>
              </div>
            }
          >



            <div className="h-[350px] w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '24px',
                      padding: '16px',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }} 
                    itemStyle={{ color: '#F0F0FB' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>


          <ChartCard title="Ecosystem Activity" subtitle="Verified interaction density">
            <div className="h-[350px] w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(240, 240, 251, 0.25)', fontSize: 10, fontWeight: 900 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '24px',
                      padding: '16px',
                    }} 
                    itemStyle={{ color: '#F0F0FB' }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[10, 10, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </ChartCard>
        </div>

        {/* Lower Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Activity Feed */}
          <div className="xl:col-span-2 bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium relative overflow-hidden group interactive-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/10 to-transparent" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#F0F0FB] tracking-tighter">Infrastructure Ledger</h3>
                <p className="stat-label">Verified activity stream</p>
              </div>
              <button className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/10 text-[10px] font-black text-[#F0F0FB]/40 hover:bg-white hover:text-black transition-all flex items-center space-x-3 uppercase tracking-widest group/btn shadow-sm">
                <span>View Full Audit</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-6 p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.05] hover:border-primary-blue/20 hover:bg-white/[0.04] transition-all duration-500 group/item shadow-sm relative overflow-hidden">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex-shrink-0 group-hover/item:bg-primary-blue/10 transition-colors">
                    <Clock className="w-5 h-5 text-[#F0F0FB]/15 group-hover/item:text-primary-blue transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-black text-[#F0F0FB] tracking-tight">{activity.user}</p>
                      <span className="text-[10px] font-black text-[#F0F0FB]/10 uppercase tracking-widest">{activity.time}</span>
                    </div>
                    <p className="text-sm text-[#F0F0FB]/40 mt-1 font-medium tracking-tight leading-relaxed">{activity.action}</p>
                  </div>
                  <StatusBadge 
                    status={activity.type} 
                    variant={activity.status === "high" ? "error" : activity.status === "active" ? "success" : activity.status === "info" ? "info" : "warning"} 
                    className="hidden lg:inline-flex"
                  />
                </div>
              ))}
            </div>

          </div>

          <div className="space-y-10">
            {/* Policy Enforcement Section */}
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium interactive-card relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/20 to-transparent" />
              
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#F0F0FB] tracking-tighter">Policy Guard</h3>
                  <p className="stat-label">High-risk moderation</p>
                </div>
                <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 shadow-lg shadow-error/10">
                  <ShieldAlert className="w-5 h-5 text-error stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-8">
                {moderationSnapshot.map((item) => (
                  <div key={item.id} className="space-y-5 group/mod p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 shadow-inner">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-black text-[#F0F0FB] truncate tracking-tight">{item.title}</p>
                        <p className="text-[10px] text-[#F0F0FB]/20 uppercase font-black tracking-widest mt-1">{item.creator}</p>
                      </div>
                      <StatusBadge 
                        status={item.risk} 
                        variant={item.risk === "High" ? "error" : item.risk === "Medium" ? "warning" : "success"} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleApprove(item.id)}
                        className="py-3 rounded-2xl bg-primary-blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-lg shadow-primary-blue/20 active:scale-95"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(item.id)}
                        className="py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[#F0F0FB]/40 text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white hover:border-error transition-all active:scale-95 shadow-sm"
                      >
                        Reject
                      </button>

                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Financial Alerts */}
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium interactive-card relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent" />
              
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#F0F0FB] tracking-tighter">Treasury Alerts</h3>
                  <p className="stat-label">Liquidity monitoring</p>
                </div>
                <div className="p-3.5 rounded-xl bg-primary-blue/10 border border-primary-blue/20 shadow-lg shadow-primary-blue/10">
                  <CreditCard className="w-5 h-5 text-primary-blue stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-4">
                {paymentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.05] group/alert hover:border-primary-blue/20 hover:bg-white/[0.04] transition-all duration-500 cursor-pointer shadow-sm relative overflow-hidden">
                    <div className="flex items-center space-x-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-orange animate-pulse" />
                      <div>
                        <p className="text-sm font-black text-[#F0F0FB] tracking-tight">{alert.type}</p>
                        <p className="text-[9px] text-[#F0F0FB]/20 uppercase font-black tracking-widest mt-1">{alert.brand || alert.creator}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#F0F0FB] tracking-tight">{alert.amount}</p>
                      <p className="text-[10px] text-[#F0F0FB]/10 uppercase font-black mt-1 tracking-tighter">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedStat}
        onClose={() => setSelectedStat(null)}
        title={selectedStat?.label || ""}
        subtitle={`System-wide infrastructure analysis for ${selectedStat?.label}`}
      >
        <div className="space-y-12">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] shadow-sm">
              <p className="stat-label mb-2">Cycle Aggregate</p>
              <p className="text-4xl font-black text-[#F0F0FB] tracking-tighter">{selectedStat?.value}</p>
            </div>
            <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] shadow-sm">
              <p className="stat-label mb-2">Cycle Velocity</p>
              <p className={cn(
                "text-4xl font-black tracking-tighter",
                selectedStat?.up ? 'text-primary-blue' : 'text-error'
              )}>{selectedStat?.trend}</p>
            </div>
          </div>


          <div className="space-y-8">
            <h4 className="stat-label">Comparative Benchmarks</h4>
            <div className="space-y-4">
              {[
                { label: "Prior Quarter", value: "10,240", change: "+8%" },
                { label: "Prior Semester", value: "28,500", change: "+15%" },
                { label: "Historical Baseline", value: "85,000", change: "+42%" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.08] shadow-sm hover:border-primary-blue/20 transition-all cursor-pointer group">
                  <span className="text-[11px] text-[#F0F0FB]/30 font-black uppercase tracking-widest">{item.label}</span>
                  <div className="flex items-center space-x-5">
                    <span className="text-base font-black text-[#F0F0FB] tracking-tighter">{item.value}</span>
                    <span className="text-[10px] font-black text-primary-blue px-3 py-1.5 rounded-xl bg-primary-blue/10 border border-primary-blue/15 shadow-sm">{item.change}</span>
                  </div>
                </div>
              ))}

            </div>
          </div>

          <div className="p-10 rounded-[40px] bg-primary-blue/5 border border-primary-blue/15 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
              <TrendingUp className="w-32 h-32 text-primary-blue" />
            </div>
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-primary-blue uppercase tracking-[0.4em] mb-4">Strategic Forecasting</h4>
              <p className="text-[13px] text-[#F0F0FB]/40 leading-[1.8] font-medium">
                Based on current velocity vectors, {selectedStat?.label.toLowerCase()} are forecasted to expand by an additional <span className="text-primary-blue font-black tracking-tight">15.4%</span> within the current operational cycle.
              </p>
            </div>

          </div>

          <button 
            onClick={handleExport}
            className="w-full py-6 rounded-[32px] bg-primary-blue text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary-blue/90 shadow-2xl shadow-primary-blue/30 transition-all active:scale-95"
          >
            Authorize Intelligence Export
          </button>


        </div>
      </DetailDrawer>
    </DashboardShell>
  );
}
