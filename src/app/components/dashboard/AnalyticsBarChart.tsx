"use client";

import React from "react";
import {
  Bar,
  BarChart,
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

type AnalyticsBarChartProps = {
  data: DataPoint[];
  dataKeys: string[];
  colors?: string[];
};

const DEFAULT_COLORS = ["#f97316", "#10b981", "#ef4444", "#3b82f6"];

export function AnalyticsBarChart({ data, dataKeys, colors = DEFAULT_COLORS }: AnalyticsBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] bg-white/40 rounded-[22px] border border-black/5">
        <span className="text-sm font-medium text-text-secondary">No data available</span>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="h-[280px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              cursor={{ fill: "rgba(0,0,0,0.02)" }}
            />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
