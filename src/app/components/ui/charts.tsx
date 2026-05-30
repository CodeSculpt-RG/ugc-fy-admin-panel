"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart, Line } from "recharts";
import { ChartCard } from "./chart-card";

// Re-export AdminChartCard as an alias for ChartCard or customized version
export function AdminChartCard({ title, subtitle, children, className, headerAction }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <ChartCard title={title} subtitle={subtitle} className={className} headerAction={headerAction}>
      {children}
    </ChartCard>
  );
}

// Reusable Legend Component
export function AdminLegend({ data }: { data: { name: string; value: string | number; color: string; percentage?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center space-x-3 bg-surface border border-border/80 px-4 py-2 rounded-2xl shadow-sm hover:scale-[1.02] transition-transform duration-300">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          <div className="flex items-baseline space-x-2">
            <span className="text-xs font-black text-foreground">{item.name}</span>
            {item.percentage && (
              <span className="text-[10px] font-black text-primary uppercase">{item.percentage}</span>
            )}
            <span className="text-[11px] font-bold text-foreground/40 font-mono">({item.value})</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Custom Premium Styled Tooltip
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomChartTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border p-4 rounded-2xl shadow-premium-hover backdrop-blur-md">
        <p className="text-xs font-black text-foreground uppercase tracking-wider">{payload[0].name}</p>
        <p className="text-sm font-black text-primary mt-1 font-mono">{payload[0].value}</p>
      </div>
    );
  }
  return null;
}

// Reusable Donut Chart Component
export function AdminDonutChart({ data, height = 240 }: { data: { name: string; count: number; color: string }[], height?: number }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  const legendData = data.map(item => ({
    name: item.name,
    value: item.count,
    color: item.color,
    percentage: total > 0 ? `${Math.round((item.count / total) * 100)}%` : "0%"
  }));

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <div style={{ height: `${height}px`, minHeight: `${height}px` }} className="w-full flex items-center justify-center text-foreground/20 text-xs uppercase tracking-widest font-black">
          Loading Data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative w-full min-w-0" style={{ height: `${height}px`, minHeight: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={height * 0.28}
              outerRadius={height * 0.42}
              paddingAngle={4}
              dataKey="count"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Inner Label for Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-foreground tracking-tighter">{total}</span>
          <span className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em] mt-1">TOTAL</span>
        </div>
      </div>
      <AdminLegend data={legendData} />
    </div>
  );
}

// Reusable Bar Chart Component
export function AdminBarChart({ data, xKey, yKey, color = "#ff6a00", height = 240 }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div style={{ height: `${height}px`, minHeight: `${height}px` }} className="w-full flex items-center justify-center text-foreground/20 text-xs uppercase tracking-widest font-black">
        Loading Data...
      </div>
    );
  }

  return (
    <div className="w-full min-w-0" style={{ height: `${height}px`, minHeight: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey={xKey} 
            stroke="var(--text-secondary)" 
            fontSize={10} 
            fontWeight="bold"
            tickLine={false}
          />
          <YAxis 
            stroke="var(--text-secondary)" 
            fontSize={10} 
            fontWeight="bold"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip cursor={{ fill: "var(--bg-surface-elevated)" }} />
          <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} isAnimationActive={false} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Reusable Line Chart Component
export function AdminLineChart({ data, xKey, yKey, color = "#ff6a00", height = 240 }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div style={{ height: `${height}px`, minHeight: `${height}px` }} className="w-full flex items-center justify-center text-foreground/20 text-xs uppercase tracking-widest font-black">
        Loading Data...
      </div>
    );
  }

  return (
    <div className="w-full min-w-0" style={{ height: `${height}px`, minHeight: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey={xKey} 
            stroke="var(--text-secondary)" 
            fontSize={10} 
            fontWeight="bold"
            tickLine={false}
          />
          <YAxis 
            stroke="var(--text-secondary)" 
            fontSize={10} 
            fontWeight="bold"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey={yKey} 
            stroke={color} 
            strokeWidth={3} 
            dot={{ r: 4, stroke: color, strokeWidth: 2, fill: "#ffffff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
