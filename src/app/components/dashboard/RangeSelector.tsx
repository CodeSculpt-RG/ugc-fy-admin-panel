"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

type RangeOption = "7d" | "30d" | "90d";

type RangeSelectorProps = {
  currentRange: RangeOption;
  onRangeChange: (range: RangeOption) => void;
};

export function RangeSelector({ currentRange, onRangeChange }: RangeSelectorProps) {
  const options: { label: string; value: RangeOption }[] = [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
  ];

  return (
    <div className="flex items-center bg-white/60 rounded-full border border-black/5 p-1 shadow-inner">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onRangeChange(opt.value)}
          aria-pressed={currentRange === opt.value}
          className={cn(
            "px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300",
            currentRange === opt.value
              ? "bg-white text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
              : "text-text-secondary hover:text-foreground hover:bg-white/40"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
