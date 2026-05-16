"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
        "interactive-card glass-card rounded-[32px] p-8 group relative overflow-hidden",
        onClick ? "cursor-pointer" : ""
      )}
    >
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={cn(
          "p-4 rounded-2xl border transition-all duration-500 group-hover:scale-110",
          color === "blue" 
            ? "bg-primary-blue/5 border-primary-blue/15 text-primary-blue" 
            : color === "success"
            ? "bg-success-green/5 border-success-green/15 text-success-green"
            : color === "error"
            ? "bg-error/5 border-error/15 text-error"
            : "bg-accent-orange/5 border-accent-orange/15 text-accent-orange"
        )}>
          <Icon className="w-5 h-5 stroke-[2.5]" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center space-x-1.5 text-[10px] font-black px-3 py-1.5 rounded-full border tracking-wider",
            up 
              ? "bg-success-green/5 text-success-green border-success-green/15" 
              : "bg-error/5 text-error border-error/15"
          )}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <p className="stat-label">{label}</p>
        <h2 className="text-4xl font-black text-[#F0F0FB] tracking-tighter group-hover:tracking-tight transition-all duration-500">
          {value}
        </h2>
      </div>

      
      <div className="mt-8 pt-6 border-t border-white/[0.05] relative z-10">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.3em] font-black text-[#F0F0FB]/20 group-hover:text-primary-blue transition-colors duration-500">
          <span>Operational Delta</span>
          <div className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-primary-blue group-hover:border-primary-blue transition-all duration-500">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#F0F0FB]/20 group-hover:text-white" />
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
    default: "bg-[#F0F0FB]/5 text-[#F0F0FB]/40 border-white/10",
    success: "bg-success-green/5 text-success-green border-success-green/15",
    warning: "bg-accent-orange/5 text-accent-orange border-accent-orange/15",
    error: "bg-error/5 text-error border-error/15",
    info: "bg-primary-blue/5 text-primary-blue border-primary-blue/15",
  };


  return (
    <span className={cn(
      "inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border transition-all duration-500",
      variants[variant],
      className
    )}>
      <span className={cn(
        "w-1 h-1 rounded-full mr-2",
        variant === "success" ? "bg-success-green shadow-[0_0_8px_rgba(16,185,129,0.4)]" : 
        variant === "info" ? "bg-primary-blue shadow-[0_0_8px_rgba(37,99,235,0.4)]" : 
        variant === "warning" ? "bg-accent-orange shadow-[0_0_8px_rgba(249,115,22,0.4)]" :
        variant === "error" ? "bg-error shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
        "bg-[#F0F0FB]/20"
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
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
      <div className="space-y-3">
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-[#F0F0FB] leading-[0.9]">
          {title}<span className="text-primary-blue">/</span>
        </h1>
        {subtitle && (
          <p className="text-[11px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.4em] max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center space-x-3">
          {children}
        </div>
      )}

    </div>
  );
}
