import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-white/70 bg-white/70 p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-12", className)}>
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-600 shadow-sm">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-normal text-foreground">{title}</h3>
      <p className="max-w-sm text-sm leading-6 text-text-secondary">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
