"use client";

import React from "react";
import { Loader2, AlertCircle, RefreshCw, FolderOpen, Database, Copy, Check } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Synchronizing Secure Ledger...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] p-12 text-center", className)}>
      <div className="relative mb-8">
        <div className="absolute -inset-4 rounded-full bg-orange-500/10 blur-xl animate-pulse" />
        <div className="relative p-6 rounded-[32px] ugcfy-glass flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin stroke-[2.5]" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary animate-pulse">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No Operational Records Found",
  description = "The database query returned zero matching entities for the specified filter criteria.",
  icon = <FolderOpen className="w-12 h-12 text-foreground/20" />,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[360px] p-8 sm:p-12 text-center ugcfy-glass rounded-[28px]", className)}>
      <div className="p-7 rounded-[28px] bg-white/75 border border-black/5 shadow-sm mb-8">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-normal mb-3">{title}</h3>
      <p className="text-text-secondary text-sm max-w-md mx-auto mb-8 leading-6">
        {description}
      </p>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Dashboard Data Unavailable",
  message = "We could not load this workspace section. Core admin navigation remains available.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[360px] p-8 sm:p-12 text-center rounded-[28px] border border-red-200/70 bg-red-50/70 shadow-sm backdrop-blur-xl", className)}>
      <div className="p-7 rounded-[28px] bg-red-500/10 border border-red-500/15 text-red-600 shadow-sm mb-8">
        <AlertCircle className="w-12 h-12 stroke-[2.5]" />
      </div>
      <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-normal mb-3">{title}</h3>
      <p className="text-text-secondary text-sm max-w-md mx-auto mb-8 leading-6">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex min-h-11 items-center gap-3 px-5 py-3 rounded-full ugcfy-gradient-cta text-white font-semibold text-sm transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Handshake</span>
        </button>
      )}
    </div>
  );
}

interface MissingTableStateProps {
  tableName: string;
  migrationSql: string;
  className?: string;
}

export function MissingTableState({ tableName, migrationSql, className }: MissingTableStateProps) {
  const [copied, setCopied] = React.useState(false);
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const copySql = () => {
    navigator.clipboard.writeText(migrationSql);
    setCopied(true);
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, 2000);
  };

  const isEscalations = tableName === "chat_escalations";
  const titleText = isEscalations ? "Escalations queue is ready." : "Optional workspace not provisioned";
  const descText = isEscalations 
    ? "Escalation records will appear here once the tracking table is configured." 
    : "This admin section is available, but its optional data table has not been configured yet.";

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[420px] p-8 sm:p-10 text-center ugcfy-glass rounded-[28px]", className)}>
      <div className="p-7 rounded-[28px] bg-orange-500/10 border border-orange-500/15 text-orange-600 shadow-sm mb-6">
        <Database className="w-12 h-12 stroke-[2.5]" />
      </div>
      <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-normal mb-2">
        {titleText}
      </h3>
      <p className="text-text-secondary text-sm max-w-lg mx-auto mb-6 leading-6">
        {descText}
      </p>

      <details className="w-full max-w-2xl text-left rounded-[24px] border border-black/5 bg-white/60 p-5 shadow-sm">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Admin setup details
        </summary>
        <p className="mt-3 text-sm text-text-secondary">Optional table not provisioned: {tableName}</p>
      </details>
      <div className="w-full max-w-2xl text-left bg-[#18181B] border border-black/10 rounded-[24px] p-6 relative shadow-xl mt-4 mb-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 font-mono">SQL Migration Query</span>
          <button
            onClick={copySql}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-white text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 border border-border"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied DDL" : "Copy SQL"}</span>
          </button>
        </div>
        <pre className="text-xs font-mono text-[#E5E7EB] whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar max-h-48 pr-4">
          <code>{migrationSql}</code>
        </pre>
      </div>
    </div>
  );
}
