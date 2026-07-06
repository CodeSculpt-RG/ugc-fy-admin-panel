"use client";

import React, { useState, useEffect } from "react";
import { Zap, Activity } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/lib/utils";
import { adminFetch, isAbortError, isAdminSessionExpiredError } from "@/app/services/adminApiClient";
import { useAdminAuthOptional } from "@/app/context/AdminAuthContext";

const COPY = {
  systemHealth: "System Health",
  sync: "Sync:",
} as const;

interface HealthData {
  success: boolean;
  supabaseConnected: boolean;
  source: string;
  timestamp: string;
  profilesCount: number;
  creatorsCount: number;
  brandsCount: number;
}

export default function SystemStatusPopover() {
  const auth = useAdminAuthOptional();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth?.session?.access_token) {
      return;
    }

    const controller = new AbortController();
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const res = await adminFetch("/api/admin/health", {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success) {
          setHealthData(data);
        }
      } catch (err) {
        if (isAbortError(err)) return;
        if (isAdminSessionExpiredError(err)) return;
        console.error("Failed to sync system status:", err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void fetchHealth();
      }
    });
    return () => controller.abort(new DOMException("System status request cancelled", "AbortError"));
  }, [auth?.session?.access_token]);

  const isConnected = healthData?.supabaseConnected ?? true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="System Status"
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all cursor-pointer group outline-none",
            isConnected ? "bg-success-green/5 border-success-green/10 hover:bg-success-green/10 hover:border-success-green/20" : "bg-accent-orange/5 border-accent-orange/10 hover:bg-accent-orange/10 hover:border-accent-orange/20"
          )}
        >
          <div className="relative flex items-center justify-center">
            <Zap className={cn("w-3.5 h-3.5 group-hover:scale-110 transition-transform", isConnected ? "text-success-green fill-success-green" : "text-accent-orange fill-accent-orange")} />
            <span className={cn("absolute inset-0 blur-sm opacity-20 group-hover:opacity-40 transition-opacity", isConnected ? "bg-success-green" : "bg-accent-orange")} />
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-[0.1em] hidden sm:inline", isConnected ? "text-success-green" : "text-accent-orange")}>
            {loading ? "CHECKING..." : isConnected ? "SYSTEM LIVE" : "SYSTEM DEGRADED"}
          </span>
          <span className={cn("w-2 h-2 rounded-full animate-pulse sm:hidden", isConnected ? "bg-success-green shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-accent-orange shadow-[0_0_8px_rgba(249,115,22,0.5)]")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-surface border border-border p-5 rounded-[28px] shadow-2xl"
        sideOffset={12}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">{COPY.systemHealth}</h4>
            <div className="flex items-center space-x-2">
               <span className={cn("text-[10px] font-bold uppercase", isConnected ? "text-success-green" : "text-accent-orange")}>
                 {isConnected ? "Operational" : "Degraded"}
               </span>
               <span className={cn("flex h-2 w-2 rounded-full animate-pulse", isConnected ? "bg-success-green shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-accent-orange shadow-[0_0_10px_rgba(249,115,22,0.4)]")} />
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { name: "Database Endpoint", status: isConnected ? "Connected" : "Unreachable", color: isConnected ? "green" : "orange" },
              { name: "Profiles Ledger", status: `${healthData?.profilesCount ?? 0} Records`, color: "green" },
              { name: "Creator Profiles", status: `${healthData?.creatorsCount ?? 0} Records`, color: "green" },
              { name: "Brand Profiles", status: `${healthData?.brandsCount ?? 0} Records`, color: "green" },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between group/item">
                <span className="text-xs text-foreground/40 group-hover/item:text-foreground/60 transition-colors font-medium">{service.name}</span>
                <div className="flex items-center space-x-3">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider",
                    service.color === "green" ? "text-success-green" : "text-accent-orange"
                  )}>
                    {service.status}
                  </span>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover/item:scale-125",
                    service.color === "green" 
                      ? "bg-success-green shadow-[0_0_6px_rgba(16,185,129,0.3)]" 
                      : "bg-accent-orange shadow-[0_0_6px_rgba(249,115,22,0.3)]"
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border flex justify-center items-center">
          <Activity className="w-3 h-3 text-foreground/20 mr-1.5" />
          <span className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">
            {COPY.sync} {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
