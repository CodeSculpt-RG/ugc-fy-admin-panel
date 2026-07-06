"use client";

import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

type DataPoint = {
  date: string;
  [key: string]: string | number;
};

type AnalyticsAreaChartProps = {
  data: DataPoint[];
  dataKeys: string[];
  colors?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
};

const DEFAULT_COLORS = ["#f97316", "#10b981", "#ef4444", "#3b82f6"];

export function AnalyticsAreaChart({ 
  data, 
  dataKeys, 
  colors = DEFAULT_COLORS,
  emptyTitle = "No data yet",
  emptyDescription = "Real data will appear here once available." 
}: AnalyticsAreaChartProps) {
  
  const hasData = data && data.length > 0 && data.some((point) =>
    Object.entries(point).some(([key, value]) => key !== "date" && typeof value === "number" && value > 0)
  );

  if (!hasData) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-white/50 p-6 text-center">
        <div>
          <p className="text-sm font-semibold text-neutral-950">{emptyTitle}</p>
          <p className="mt-1 text-xs text-neutral-500 max-w-[250px] mx-auto">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="h-[280px] w-full mt-4 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {dataKeys.map((key, index) => (
                <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#9CA3AF" }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#9CA3AF" }} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                fontSize: "12px",
                fontWeight: "bold"
              }}
              itemStyle={{ color: "#111827", textTransform: "capitalize" }}
            />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color${key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
