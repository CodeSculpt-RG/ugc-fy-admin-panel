import React from "react";
import { cn } from "@/app/lib/utils";

export interface CommandHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  statusChips?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function CommandHeader({
  eyebrow,
  title,
  description,
  actions,
  statusChips,
  className,
  children,
}: CommandHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-4 sm:pb-6", className)}>
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-orange-500">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-[600px]">
            {description}
          </p>
        )}
        {statusChips && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {statusChips}
          </div>
        )}
      </div>
      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
