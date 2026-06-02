"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, LineChart, Line } from "recharts";
import { cn } from "@/app/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartData = any;

const COLORS = ["#2563EB", "#10B981", "#F97316", "#EC4899", "#8B5CF6", "#14B8A6"];
const responsiveChartProps = {
  width: "100%",
  height: "100%",
  minWidth: 1,
  minHeight: 1,
  initialDimension: { width: 1, height: 1 },
} as const;

export const AdminChartEmptyState = ({ message = "No data available." }: { message?: string }) => (
  <div className="h-full flex items-center justify-center text-foreground/40 text-sm font-semibold">
    {message}
  </div>
);

export const AdminChartCard = ({ title, subtitle, children, className }: { title: string, subtitle?: string, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card-bg border border-border rounded-[28px] p-8 shadow-sm flex flex-col relative", className)}>
    <div className="mb-6 space-y-1">
      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
    </div>
    <div className="flex-1 w-full min-h-[280px]">
      {children}
    </div>
  </div>
);

export const AdminChartLegend = ({ data, total }: { data: ChartData[], total?: number }) => {
  if (!data || data.length === 0) return null;
  const calculatedTotal = total ?? data.reduce((acc, curr) => acc + (curr.value || curr.count || 0), 0);
  
  return (
    <div className="flex flex-col space-y-3 mt-6 w-full">
      {data.map((item, i) => {
        const val = item.value || item.count || 0;
        const percentage = calculatedTotal > 0 ? Math.round((val / calculatedTotal) * 100) : 0;
        return (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3 truncate mr-4">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }} />
              <span className="font-semibold text-foreground truncate">{item.name}</span>
            </div>
            <div className="text-text-secondary font-medium flex-shrink-0">
              {percentage}% — {val.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const AdminDonutChart = ({ data, emptyMessage = "No user data available yet." }: { data: ChartData[], emptyMessage?: string }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((acc, curr) => acc + (curr.value || curr.count || 0), 0);
  
  if (total === 0) return <AdminChartEmptyState message={emptyMessage} />;

  const chartData = data.map((d, i) => ({ ...d, value: d.value || d.count || 0, color: d.color || COLORS[i % COLORS.length] }));

  if (!mounted) {
    return (
      <div className="h-[320px] min-h-[320px] w-full flex items-center justify-center text-foreground/20 text-xs uppercase tracking-widest font-black">
        Loading Chart...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="h-[320px] min-h-[320px] w-full min-w-0">
        <ResponsiveContainer {...responsiveChartProps}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={4}
              cornerRadius={8}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-surface-2)', 
                border: '1px solid var(--border)', 
                borderRadius: '16px',
                padding: '12px',
                boxShadow: 'var(--shadow-premium)'
              }} 
              itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <AdminChartLegend data={chartData} total={total} />
    </div>
  );
};

export const AdminBarChart = ({ data, emptyMessage = "No data available." }: { data: ChartData[], emptyMessage?: string }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) return <AdminChartEmptyState message={emptyMessage} />;

  if (!mounted) {
    return (
      <div className="h-[320px] min-h-[320px] w-full flex items-center justify-center text-foreground/20 text-xs uppercase tracking-widest font-black">
        Loading Chart...
      </div>
    );
  }

  return (
    <div className="h-[320px] min-h-[320px] w-full min-w-0 pt-4">
      <ResponsiveContainer {...responsiveChartProps}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }} dy={15} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }} />
          <Tooltip 
            cursor={{ fill: 'var(--bg-surface-elevated)' }} 
            contentStyle={{ 
              backgroundColor: 'var(--bg-surface-2)', 
              border: '1px solid var(--border)', 
              borderRadius: '16px',
              padding: '12px',
            }} 
            itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
          />
          <Bar dataKey="value" fill="#2563EB" radius={[12, 12, 0, 0]} barSize={40} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AdminLineChart = ({ data, lines, emptyMessage = "No data available." }: { data: ChartData[], lines: { key: string, color: string }[], emptyMessage?: string }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) return <AdminChartEmptyState message={emptyMessage} />;

  if (!mounted) {
    return (
      <div className="h-[320px] min-h-[320px] w-full flex items-center justify-center text-foreground/20 text-xs uppercase tracking-widest font-black">
        Loading Chart...
      </div>
    );
  }

  return (
    <div className="h-[320px] min-h-[320px] w-full min-w-0 pt-4">
      <ResponsiveContainer {...responsiveChartProps}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }} dy={15} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-surface-2)', 
              border: '1px solid var(--border)', 
              borderRadius: '16px',
              padding: '12px',
            }} 
            itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
          />
          {lines.map((line) => (
            <Line 
              key={line.key}
              type="monotone" 
              dataKey={line.key} 
              stroke={line.color} 
              strokeWidth={4} 
              dot={{ r: 4, fill: line.color, strokeWidth: 2, stroke: 'var(--bg-main)' }} 
              activeDot={{ r: 6, strokeWidth: 0 }} 
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
