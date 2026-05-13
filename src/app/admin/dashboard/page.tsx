"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { 
  Users, 
  Building2, 
  Megaphone, 
  ShieldCheck, 
  CreditCard, 
  Scale, 
  TrendingUp, 
  Clock,
  ShieldAlert,
  ArrowRight
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
import { motion } from "framer-motion";

const stats = [
  { label: "Total Creators", value: "12,450", trend: "+12%", up: true, icon: Users, color: "blue" },
  { label: "Total Brands", value: "840", trend: "+5%", up: true, icon: Building2, color: "blue" },
  { label: "Active Campaigns", value: "312", trend: "+18%", up: true, icon: Megaphone, color: "orange" },
  { label: "Pending Moderation", value: "45", trend: "-2%", up: false, icon: ShieldCheck, color: "orange" },
  { label: "Pending Payouts", value: "$42,500", trend: "+24%", up: true, icon: CreditCard, color: "blue" },
  { label: "Open Disputes", value: "12", trend: "+2", up: true, icon: Scale, color: "error" },
];

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

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="space-y-10">
        <PageHeader 
          title="Dashboard Overview" 
          subtitle="Operational intelligence for the UGC FY ecosystem."
        >
          <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-2xl border border-white/5">
            {["Today", "Last 7 Days", "Last 30 Days"].map((tab) => (
              <button 
                key={tab}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === "Today" ? "bg-primary-blue text-white shadow-lg shadow-primary-blue/20" : "text-soft-white/40 hover:text-soft-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </PageHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <StatCard 
              key={stat.label}
              {...stat}
              delay={i * 0.1}
              color={stat.color as any}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard 
            title="Revenue Growth" 
            subtitle="Monthly platform performance"
            headerAction={
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-blue">$248,500</p>
                <p className="text-[10px] text-success font-bold uppercase tracking-widest">+12.4% vs last month</p>
              </div>
            }
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Platform Activity" subtitle="Weekly engagement metrics">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#F97316" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Lower Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Activity Feed */}
          <div className="xl:col-span-2 bg-dark-surface/50 backdrop-blur-sm border border-white/5 rounded-[32px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-soft-white">Recent Activity</h3>
              <button className="text-xs font-bold text-primary-blue hover:underline flex items-center space-x-1">
                <span>View Audit Logs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <Clock className="w-5 h-5 text-soft-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-soft-white">{activity.user}</p>
                      <span className="text-[10px] font-bold text-soft-white/20 uppercase">{activity.time}</span>
                    </div>
                    <p className="text-xs text-soft-white/40 mt-0.5">{activity.action}</p>
                  </div>
                  <StatusBadge 
                    status={activity.type} 
                    variant={activity.status === "high" ? "error" : activity.status === "active" ? "success" : activity.status === "info" ? "info" : "warning"} 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Moderation Snapshot */}
          <div className="bg-dark-surface/50 backdrop-blur-sm border border-white/5 rounded-[32px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-soft-white">Moderation Queue</h3>
              <ShieldAlert className="w-5 h-5 text-warning" />
            </div>
            <div className="space-y-6">
              {moderationSnapshot.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-soft-white truncate max-w-[150px]">{item.title}</p>
                      <p className="text-[10px] text-soft-white/30 uppercase font-bold tracking-widest">{item.creator}</p>
                    </div>
                    <StatusBadge 
                      status={item.risk} 
                      variant={item.risk === "High" ? "error" : item.risk === "Medium" ? "warning" : "success"} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 rounded-lg bg-success/10 text-success text-[10px] font-bold uppercase hover:bg-success hover:text-white transition-all">Approve</button>
                    <button className="py-2 rounded-lg bg-error/10 text-error text-[10px] font-bold uppercase hover:bg-error hover:text-white transition-all">Reject</button>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 mt-4 rounded-xl border border-dashed border-white/10 text-xs font-bold text-soft-white/20 hover:text-soft-white/40 hover:border-white/20 transition-all">
                Go to Moderation Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
