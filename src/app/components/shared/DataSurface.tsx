import React from "react";
import { cn } from "@/app/lib/utils";

export interface DataSurfaceProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function DataSurface({
  children,
  title,
  action,
  className,
}: DataSurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-white/60 bg-white/50 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl flex flex-col overflow-hidden",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-white/40 px-6 py-4 bg-white/30">
          {title && (
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1 w-full overflow-x-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}
