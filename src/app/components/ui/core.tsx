"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, X } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  up?: boolean;
  icon: LucideIcon;
  color?: "blue" | "orange" | "error" | "success";
  delay?: number;
  onClick?: () => void;
}

export function StatCard({ 
  label, 
  value, 
  trend, 
  up, 
  icon: Icon, 
  color = "blue",
  delay = 0,
  onClick
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className={cn(
        "interactive-card ugcfy-glass rounded-[28px] p-5 sm:p-6 group relative overflow-hidden",
        onClick ? "cursor-pointer" : ""
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
        <div className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110",
          color === "blue" 
            ? "bg-orange-500/10 text-orange-600" 
            : color === "success"
            ? "bg-emerald-500/10 text-emerald-600"
            : color === "error"
            ? "bg-red-500/10 text-red-600"
            : "bg-amber-500/10 text-amber-600"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full",
            up 
              ? "bg-emerald-500/10 text-emerald-600" 
              : "bg-red-500/10 text-red-600"
          )}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <p className="stat-label">{label}</p>
        <h2 className="text-3xl font-bold text-foreground tracking-normal transition-all duration-500">
          {value}
        </h2>
      </div>

      
      <div className="mt-6 pt-5 border-t border-black/5 relative z-10">
        <div className="flex items-center justify-between text-xs font-medium text-text-secondary group-hover:text-orange-600 transition-colors duration-500">
          <span>Live dashboard signal</span>
          <div className="w-8 h-8 rounded-full bg-white/70 border border-black/5 flex items-center justify-center group-hover:bg-neutral-950 group-hover:border-neutral-950 transition-all duration-500">
            <ArrowUpRight className="w-3.5 h-3.5 text-text-secondary group-hover:text-white" />
          </div>
        </div>
      </div>

    </motion.div>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function StatusBadge({ status, variant = "default", className }: StatusBadgeProps) {
  const variants = {
    default: "bg-neutral-950/5 text-neutral-700 border-black/5",
    success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/15",
    warning: "bg-amber-500/10 text-amber-700 border-amber-500/15",
    error: "bg-red-500/10 text-red-700 border-red-500/15",
    info: "bg-orange-500/10 text-orange-700 border-orange-500/15",
  };


  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold transition-all duration-500",
      variants[variant],
      className
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        variant === "success" ? "bg-emerald-500" : 
        variant === "info" ? "bg-orange-500" : 
        variant === "warning" ? "bg-amber-500" :
        variant === "error" ? "bg-red-500" :
        "bg-neutral-500"
      )} />
      {status}
    </span>

  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-normal text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm leading-6 text-text-secondary max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-3">
          {children}
        </div>
      )}

    </div>
  );
}

// ==========================================
// NEW PREMIUM ADMIN UI COMPONENT LIBRARY
// ==========================================

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function AdminButton({ 
  variant = "primary", 
  size = "md", 
  className, 
  children, 
  ...props 
}: AdminButtonProps) {
  const baseStyle = "inline-flex min-h-11 items-center justify-center font-semibold transition-all duration-300 outline-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-orange-500/30";
  
  const sizes = {
    sm: "px-4 py-2.5 rounded-xl text-[9px]",
    md: "px-6 py-3.5 rounded-2xl text-[10px]",
    lg: "px-8 py-4.5 rounded-[24px] text-[11px]",
  };

  const variants = {
    primary: "ugcfy-gradient-cta text-white hover:opacity-95",
    secondary: "bg-white/75 border border-black/5 text-foreground/80 hover:bg-white hover:text-foreground shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
    ghost: "bg-transparent text-foreground/60 hover:text-foreground hover:bg-white/50",
  };

  return (
    <button 
      className={cn(baseStyle, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</div>}
          <input
            ref={ref}
            className={cn(
              "w-full bg-white/75 border border-black/5 rounded-2xl text-sm font-medium text-foreground placeholder:text-text-secondary/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/20 transition-all",
              icon ? "pl-11 pr-4 py-3.5" : "px-4 py-3.5",
              error ? "border-error focus:ring-error/20" : "",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] font-semibold text-error mt-1">{error}</p>}
      </div>
    );
  }
);
AdminInput.displayName = "AdminInput";

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</label>}
        <select
          ref={ref}
          className={cn(
            "w-full px-4 py-3.5 bg-white/75 border border-black/5 rounded-2xl text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/20 transition-all cursor-pointer",
            error ? "border-error focus:ring-error/20" : "",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[10px] font-semibold text-error mt-1">{error}</p>}
      </div>
    );
  }
);
AdminSelect.displayName = "AdminSelect";

export function AdminCard({ title, subtitle, children, className }: { title?: string, subtitle?: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("ugcfy-glass rounded-[28px] p-6 sm:p-8 relative overflow-hidden", className)}>
      {(title || subtitle) && (
        <div className="mb-6 space-y-1">
          {title && <h3 className="text-lg font-semibold tracking-normal text-foreground">{title}</h3>}
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function AdminBadge({ label, variant = "default" }: { label: string, variant?: "default" | "success" | "warning" | "error" | "info" }) {
  return <StatusBadge status={label} variant={variant} />;
}

export function AdminTable({ 
  headers, 
  children, 
  className 
}: { 
  headers: string[], 
  children: React.ReactNode, 
  className?: string 
}) {
  return (
    <div className={cn("ugcfy-glass rounded-[28px] overflow-hidden", className)}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-white/55 border-b border-black/5 text-xs font-semibold text-text-secondary">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTabs({ 
  tabs, 
  activeTab, 
  onChange 
}: { 
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
            activeTab === tab.id
              ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
              : "bg-surface border-border text-foreground/30 hover:text-foreground hover:bg-surface-elevated hover:bg-foreground/5"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function AdminEmptyState({ 
  title = "No Operational Records Found", 
  description = "The database query returned zero matching entities." 
}: { 
  title?: string, 
  description?: string 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center glass-card rounded-[40px] border border-border min-h-[300px]">
      <div className="p-5 rounded-full bg-foreground/5 border border-border mb-4">
        <AlertTriangle className="w-8 h-8 text-text-secondary" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-xs mx-auto">{description}</p>
    </div>
  );
}

export function AdminModal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-[36px] p-8 shadow-premium-hover animate-scale-up">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2.5 bg-surface-elevated hover:bg-foreground/5 border border-border rounded-xl transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminDrawer({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-surface border-l border-border h-full flex flex-col shadow-premium-hover animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2.5 bg-surface-elevated hover:bg-foreground/5 border border-border rounded-xl transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export function formatINR(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹ 0';
  return inrFormatter.format(num);
}
