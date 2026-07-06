import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-surface-elevated/50", className)}>
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary shadow-sm">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-black text-foreground tracking-tight mb-2">{title}</h3>
      <p className="text-sm font-semibold text-foreground/50 max-w-sm">{description}</p>
    </div>
  );
}
