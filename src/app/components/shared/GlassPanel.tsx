import React from "react";
import { cn } from "@/app/lib/utils";

export function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/70 bg-white/70 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
