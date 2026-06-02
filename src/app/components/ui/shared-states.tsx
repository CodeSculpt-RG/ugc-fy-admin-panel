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
        <div className="absolute -inset-4 rounded-full bg-primary/10 blur-xl animate-pulse" />
        <div className="relative p-6 rounded-[32px] bg-surface border border-border shadow-2xl flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin stroke-[2.5]" />
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-[0.4em] text-foreground/40 animate-pulse">{message}</p>
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
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] p-12 text-center glass-card rounded-[40px] border border-border", className)}>
      <div className="p-8 rounded-[36px] bg-surface border border-border shadow-inner mb-8">
        {icon}
      </div>
      <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter mb-3">{title}</h3>
      <p className="text-foreground/40 text-xs sm:text-sm font-medium max-w-md mx-auto mb-8 leading-relaxed">
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
  title = "Infrastructure Desync Detected",
  message = "An error occurred while establishing a secure handshake with the Supabase backend service.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] p-12 text-center glass-card rounded-[40px] border border-error/20 bg-error/[0.02]", className)}>
      <div className="p-8 rounded-[36px] bg-error/10 border border-error/20 text-error shadow-inner mb-8">
        <AlertCircle className="w-12 h-12 stroke-[2.5]" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter mb-3">{title}</h3>
      <p className="text-foreground/40 text-xs sm:text-sm font-medium max-w-md mx-auto mb-8 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-3 px-8 py-4 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20 outline-none"
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
  const titleText = isEscalations ? "Escalations database is not ready." : `Database Table Missing: ${tableName}`;
  const descText = isEscalations 
    ? "Run the migration to enable escalation tracking." 
    : `The required table ${tableName} does not exist in the remote Supabase schema cache. Execute the DDL migration below in your Supabase SQL Editor.`;

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[450px] p-10 text-center glass-card rounded-[40px] border border-accent-orange/20 bg-accent-orange/[0.02]", className)}>
      <div className="p-8 rounded-[36px] bg-accent-orange/10 border border-accent-orange/20 text-accent-orange shadow-inner mb-6">
        <Database className="w-12 h-12 stroke-[2.5]" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter mb-2">
        {titleText}
      </h3>
      <p className="text-foreground/60 text-xs sm:text-sm font-medium max-w-lg mx-auto mb-6 leading-relaxed">
        {descText}
      </p>

      <div className="w-full max-w-2xl text-left bg-[#0F172A] border border-border rounded-[28px] p-6 relative shadow-2xl mb-6">
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
