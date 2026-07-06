import React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/app/lib/utils";

type MetricTone = "orange" | "neutral" | "success" | "warning" | "danger";

type MetricCardProps = {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  up?: boolean;
  tone?: MetricTone;
  className?: string;
  onClick?: () => void;
};

const toneStyles: Record<MetricTone, string> = {
  orange: "bg-orange-500/10 text-orange-600",
  neutral: "bg-neutral-950/5 text-neutral-950",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
};

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  up = true,
  tone = "orange",
  className,
  onClick,
}: MetricCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("block w-full text-left", onClick && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 rounded-[28px]")}
    >
      <GlassCard className={cn("h-full transition-all duration-300 hover:-translate-y-1 hover:bg-white/90", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", toneStyles[tone])}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold",
              up ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
            )}>
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend}
            </span>
          )}
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
          <p className="text-3xl font-bold tracking-normal text-foreground">{value}</p>
          {description && <p className="text-sm leading-6 text-text-secondary">{description}</p>}
        </div>
      </GlassCard>
    </Wrapper>
  );
}
