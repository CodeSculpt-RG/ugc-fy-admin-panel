"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { ChartCard } from "@/app/components/ui/chart-card";
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
import { Download, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const userGrowthData = [
  { name: "Jan", creators: 400, brands: 240 },
  { name: "Feb", creators: 800, brands: 300 },
  { name: "Mar", creators: 1200, brands: 450 },
  { name: "Apr", creators: 1800, brands: 600 },
  { name: "May", creators: 2400, brands: 800 },
  { name: "Jun", creators: 3200, brands: 1100 },
];

const revenueData = [
  { name: "W1", value: 45000 },
  { name: "W2", value: 52000 },
  { name: "W3", value: 48000 },
  { name: "W4", value: 61000 },
  { name: "W5", value: 55000 },
  { name: "W6", value: 72000 },
];

const campaignSectors = [
  { name: "Tech", value: 45 },
  { name: "Beauty", value: 25 },
  { name: "Fitness", value: 15 },
  { name: "Food", value: 10 },
  { name: "Gaming", value: 5 },
];

const COLORS = ["#2563EB", "#F97316", "#F0F0FB", "#6366F1", "#EC4899"];


import { useToast } from "@/app/hooks/useToast";

export default function AnalyticsPage() {
  const { showToast } = useToast();

  const handleExport = () => {
    showToast("Analytics protocol exported to secure storage", "success");
  };

  const handleConfigure = () => {
    showToast("Intelligence vectors re-synchronized", "info");
  };

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Intelligence Infrastructure" 
          subtitle="Forensic analysis of platform growth vectors, fiscal yields, and ecosystem dynamics."
        >
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleConfigure}
              className="h-12 px-6 rounded-2xl bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center shadow-sm"
            >
              <Filter className="w-4 h-4 mr-3" />
              Configure Vectors
            </button>
            <button 
              onClick={handleExport}
              className="h-12 px-8 rounded-2xl bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
            >
              <Download className="w-4 h-4 mr-3" />
              Export Protocol
            </button>
          </div>

        </PageHeader>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ChartCard title="Entity Acquisition" subtitle="Entity growth lifecycle analysis (Creators vs Corporate)">
            <div className="h-[380px] w-full pt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <div className="h-[380px] w-full pt-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <div className="h-[320px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={campaignSectors}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {campaignSectors.map((entry, index) => (
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
                {campaignSectors.map((sector, i) => (
                  <div key={sector.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#F0F0FB]/40">{sector.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-[#F0F0FB]">{sector.value}%</span>
                  </div>
                ))}

              </div>
            </div>
          </ChartCard>

          <ChartCard title="Retention Dynamics" subtitle="Temporal user behavior and churn mitigation analysis" className="lg:col-span-2">
            <div className="h-[380px] w-full pt-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
      </div>
    </DashboardShell>
  );
}
