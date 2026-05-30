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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "glass-card rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group",
        className
      )}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10">
        <div className="space-y-1.5">
          <h3 className="text-3xl font-black text-foreground tracking-tighter">{title}</h3>
          {subtitle && (
            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.4em]">
              {subtitle}
            </p>
          )}
        </div>
        {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
      </div>
      
      <div className="w-full relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
