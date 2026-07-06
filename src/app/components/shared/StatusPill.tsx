import React from "react";
import { cn } from "@/app/lib/utils";

export type StatusVariant =
  | "live"
  | "healthy"
  | "queue"
  | "secure"
  | "restricted"
  | "partial"
  | "ownerOnly"
  | "success"
  | "warning"
  | "danger"
  | "error"
  | "neutral"
  | "default"
  | "info";

export interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
  dot?: boolean;
}

export function StatusPill({ label, variant = "neutral", className, dot = true }: StatusPillProps) {
  const variantStyles: Record<StatusVariant, string> = {
    live: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    healthy: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    
    queue: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    
    warning: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    partial: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    
    danger: "bg-red-500/10 text-red-700 border-red-500/20",
    error: "bg-red-500/10 text-red-700 border-red-500/20",
    restricted: "bg-red-500/10 text-red-700 border-red-500/20",
    
    secure: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
    ownerOnly: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    
    neutral: "bg-slate-500/10 text-slate-700 border-slate-500/20",
    default: "bg-slate-500/10 text-slate-700 border-slate-500/20",
    info: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  };

  const dotStyles: Record<StatusVariant, string> = {
    live: "bg-emerald-500",
    healthy: "bg-emerald-500",
    success: "bg-emerald-500",
    
    queue: "bg-blue-500",
    
    warning: "bg-amber-500",
    partial: "bg-amber-500",
    
    danger: "bg-red-500",
    error: "bg-red-500",
    restricted: "bg-red-500",
    
    secure: "bg-indigo-500",
    ownerOnly: "bg-purple-500",
    
    neutral: "bg-slate-500",
    default: "bg-slate-500",
    info: "bg-blue-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", dotStyles[variant])} />
      )}
      {label}
    </span>
  );
}
