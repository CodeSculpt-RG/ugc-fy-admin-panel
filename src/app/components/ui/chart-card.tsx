"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  headerAction,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-dark-surface/50 backdrop-blur-sm border border-white/5 rounded-[32px] p-8",
        className
      )}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-soft-white">{title}</h3>
          {subtitle && <p className="text-xs text-soft-white/40">{subtitle}</p>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      
      <div className="w-full">
        {children}
      </div>
    </motion.div>
  );
}
