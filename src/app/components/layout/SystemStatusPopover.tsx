"use client";

import React from "react";
import { Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/lib/utils";

export default function SystemStatusPopover() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-success-green/5 border border-success-green/10 hover:bg-success-green/10 hover:border-success-green/20 transition-all cursor-pointer group outline-none">
          <div className="relative flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-success-green fill-success-green group-hover:scale-110 transition-transform" />
            <span className="absolute inset-0 bg-success-green blur-sm opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
          <span className="text-[10px] font-black text-success-green uppercase tracking-[0.1em] hidden sm:inline">System Live</span>
          <span className="w-2 h-2 bg-success-green rounded-full animate-pulse sm:hidden shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-[#111827] border border-white/10 p-5 rounded-[28px] shadow-2xl"
        sideOffset={12}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
            <h4 className="text-[10px] font-black text-[#F0F0FB] uppercase tracking-[0.2em]">System Infrastructure</h4>
            <div className="flex items-center space-x-2">
               <span className="text-[10px] font-bold text-success-green uppercase">99.9% Up</span>
               <span className="flex h-2 w-2 rounded-full bg-success-green shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { name: "API Gateway", status: "Operational", color: "green" },
              { name: "User Auth", status: "Operational", color: "green" },
              { name: "Payment Processor", status: "Slight Delay", color: "orange" },
              { name: "Media Assets", status: "Operational", color: "green" },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between group/item">
                <span className="text-xs text-[#F0F0FB]/40 group-hover/item:text-[#F0F0FB]/60 transition-colors font-medium">{service.name}</span>
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
        
        <div className="mt-6 pt-4 border-t border-white/[0.05] flex justify-center">
          <button className="text-[10px] font-black text-[#F0F0FB]/20 hover:text-primary-blue transition-all uppercase tracking-[0.2em] hover:tracking-[0.25em]">
            Detailed Analytics
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
