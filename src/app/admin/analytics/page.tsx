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

const COLORS = ["#2563EB", "#F97316", "#10B981", "#F59E0B", "#EF4444"];

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <PageHeader 
        title="Platform Analytics" 
        subtitle="Deep dive into growth, revenue, and ecosystem performance."
      >
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-white/5 border-white/10 text-soft-white rounded-xl h-12">
            <Filter className="w-4 h-4 mr-2" />
            Filter View
          </Button>
          <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ChartCard title="User Acquisition" subtitle="Creators vs Brands growth over 6 months">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorCreators" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBrands" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="creators" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCreators)" />
                <Area type="monotone" dataKey="brands" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorBrands)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue Flow (GMV)" subtitle="Weekly transaction volume">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#10B981" radius={[10, 10, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ChartCard title="Campaign Sectors" subtitle="Market distribution by industry" className="lg:col-span-1">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={campaignSectors}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {campaignSectors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {campaignSectors.map((sector, i) => (
                <div key={sector.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-xs text-soft-white/60">{sector.name}</span>
                  </div>
                  <span className="text-xs font-bold text-soft-white">{sector.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Churn Rate vs Retention" subtitle="Monthly user behavior analysis" className="lg:col-span-2">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,240,251,0.4)', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="creators" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} />
                <Line type="monotone" dataKey="brands" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#F97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </DashboardShell>
  );
}
