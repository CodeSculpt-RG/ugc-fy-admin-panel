import React from "react";
import { cn } from "@/app/lib/utils";

export interface MetricTileProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  status?: React.ReactNode;
  description?: string;
  className?: string;
}

export function MetricTile({
  icon,
  label,
  value,
  status,
  description,
  className,
}: MetricTileProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] p-4 bg-white/70 border border-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-md flex flex-col gap-2 relative overflow-hidden interactive-card group",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 transition-colors group-hover:bg-orange-500/15">
              {icon}
            </div>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        {status && <div>{status}</div>}
      </div>
      <div className="mt-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </span>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-auto truncate">
          {description}
        </p>
      )}
    </div>
  );
}
