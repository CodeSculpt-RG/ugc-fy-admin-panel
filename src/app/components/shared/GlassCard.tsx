import React from "react";
import { cn } from "@/app/lib/utils";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn("rounded-[28px] ugcfy-glass p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}
