import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ErrorStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ErrorState({ title, description, actionLabel = "Retry", onAction, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center border border-error/20 rounded-2xl bg-error/5", className)}>
      <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mb-6 text-error shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-black text-foreground tracking-tight mb-2">{title}</h3>
      <p className="text-sm font-semibold text-foreground/60 max-w-sm mb-6">{description}</p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-elevated border border-border text-foreground hover:bg-foreground/5 hover:border-foreground/20 transition-all text-xs font-black uppercase tracking-wider"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
