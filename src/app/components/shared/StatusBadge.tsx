import React from "react";
import { cn } from "@/app/lib/utils";

type StatusBadgeProps = {
  children?: React.ReactNode;
  status?: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
};

export function StatusBadge({ children, status, variant = "default", className }: StatusBadgeProps) {
  const styles = {
    default: "bg-neutral-950/5 text-neutral-700 border-black/5",
    success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/15",
    warning: "bg-amber-500/10 text-amber-700 border-amber-500/15",
    error: "bg-red-500/10 text-red-700 border-red-500/15",
    info: "bg-orange-500/10 text-orange-700 border-orange-500/15",
  };

  const dotStyles = {
    default: "bg-neutral-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-orange-500",
  };

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", styles[variant], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])} />
      {children ?? status}
    </span>
  );
}
