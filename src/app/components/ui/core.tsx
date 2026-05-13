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
}

export function StatCard({ 
  label, 
  value, 
  trend, 
  up, 
  icon: Icon, 
  color = "blue",
  delay = 0 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="bg-dark-surface/50 backdrop-blur-sm border border-white/5 rounded-[24px] p-6 group hover:border-primary-blue/30 transition-all relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-3 rounded-2xl border",
          color === "blue" ? "bg-primary-blue/10 border-primary-blue/20 text-primary-blue" :
          color === "orange" ? "bg-accent-orange/10 border-accent-orange/20 text-accent-orange" :
          color === "success" ? "bg-success/10 border-success/20 text-success" :
          "bg-error/10 border-error/20 text-error"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full",
            up ? "bg-success/10 text-success" : "bg-error/10 text-error"
          )}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-soft-white/40">{label}</p>
        <h2 className="text-3xl font-bold text-soft-white">{value}</h2>
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-soft-white/20">
          <span>View Details</span>
          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
    default: "bg-white/5 text-soft-white/60 border-white/10",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-error/10 text-error border-error/20",
    info: "bg-primary-blue/10 text-primary-blue border-primary-blue/20",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      variants[variant],
      className
    )}>
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-soft-white">{title}</h1>
        {subtitle && <p className="text-soft-white/40 mt-1">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center space-x-3">
          {children}
        </div>
      )}
    </div>
  );
}
