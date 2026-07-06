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
    <div className={cn("flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-red-200/70 bg-red-50/70 p-8 text-center shadow-sm backdrop-blur-xl sm:p-12", className)}>
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-600 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-normal text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-6 text-text-secondary">{description}</p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/5 bg-white/80 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
