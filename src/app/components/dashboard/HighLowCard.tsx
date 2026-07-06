"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

type HighLowCardProps = {
  title: string;
  highValue: number | null;
  highDate: string | null;
  lowValue: number | null;
  lowDate: string | null;
  formatValue?: (val: number) => string;
};

export function HighLowCard({ title, highValue, highDate, lowValue, lowDate, formatValue }: HighLowCardProps) {
  const displayHigh = highValue !== null ? (formatValue ? formatValue(highValue) : highValue.toLocaleString()) : "No data yet";
  const displayLow = lowValue !== null ? (formatValue ? formatValue(lowValue) : lowValue.toLocaleString()) : "No data yet";

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl flex flex-col justify-between">
      <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">{title}</h4>
      
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Highest Day</p>
              <p className="text-xs text-foreground font-medium">{highDate || "No data yet"}</p>
            </div>
          </div>
          <span className="font-black text-emerald-600 text-lg">{displayHigh}</span>
        </div>

        <div className="w-full h-px bg-black/5" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Lowest Day</p>
              <p className="text-xs text-foreground font-medium">{lowDate || "No data yet"}</p>
            </div>
          </div>
          <span className="font-black text-red-600 text-lg">{displayLow}</span>
        </div>
      </div>
    </div>
  );
}
