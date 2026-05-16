"use client";

import React from "react";
import { Bell, Check, Info, AlertTriangle, CreditCard, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/lib/utils";

const notifications = [
  {
    id: 1,
    title: "Payment Received",
    description: "New payment of $1,200 received from Nike Global",
    time: "2m ago",
    type: "payment",
    unread: true,
    icon: CreditCard,
    color: "text-primary-blue bg-primary-blue/10",
  },
  {
    id: 2,
    title: "Moderation Alert",
    description: "High-risk video content detected in queue #402",
    time: "15m ago",
    type: "moderation",
    unread: true,
    icon: Shield,
    color: "text-error bg-error/10",
  },
  {
    id: 3,
    title: "Dispute Opened",
    description: "Creator Marcus Thorne opened a dispute for Campaign #12",
    time: "1h ago",
    type: "dispute",
    unread: false,
    icon: AlertTriangle,
    color: "text-warning bg-warning/10",
  },
  {
    id: 4,
    title: "System Update",
    description: "Scheduled maintenance completed successfully",
    time: "5h ago",
    type: "system",
    unread: false,
    icon: Info,
    color: "text-success bg-success/10",
  },
];

export default function NotificationDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-[#F0F0FB]/30 hover:text-[#F0F0FB] hover:bg-white/[0.06] hover:border-white/10 transition-all group outline-none active:scale-90">
          <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-accent-orange rounded-full border-2 border-[#030712] animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[420px] bg-[#111827] border border-white/10 p-4 rounded-[40px] shadow-2xl overflow-hidden relative"
        sideOffset={16}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/30 to-transparent" />
        
        <div className="flex items-center justify-between px-5 py-5 mb-4 border-b border-white/[0.05]">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-black text-[#F0F0FB] uppercase tracking-[0.2em]">Intel Feed</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-blue/10 border border-primary-blue/10 text-[9px] font-black text-primary-blue uppercase tracking-widest">4 New</span>
          </div>
          <button className="text-[10px] font-black text-[#F0F0FB]/20 hover:text-primary-blue uppercase tracking-[0.2em] transition-colors">Mark All Read</button>
        </div>

        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
          {notifications.map((notification) => (
            <DropdownMenuItem 
              key={notification.id}
              className="flex items-start space-x-5 p-5 rounded-[28px] bg-white/[0.02] border border-white/[0.03] focus:bg-primary-blue focus:text-white cursor-pointer transition-all duration-300 outline-none group"
            >
              <div className={cn(
                "p-3.5 rounded-[18px] border flex-shrink-0 group-focus:scale-110 transition-all duration-500",
                !notification.unread 
                  ? "bg-white/[0.02] border-white/5 text-[#F0F0FB]/20" 
                  : "bg-primary-blue/5 border-primary-blue/10 text-primary-blue"
              )}>
                {notification.unread ? <notification.icon className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-black text-[#F0F0FB]/20 uppercase tracking-[0.3em]">{notification.type}</p>
                  <span className="text-[9px] font-black text-[#F0F0FB]/10 uppercase tracking-tighter">{notification.time}</span>
                </div>
                <p className="text-sm font-black text-[#F0F0FB] tracking-tight leading-snug group-focus:text-white transition-colors">
                  {notification.title}
                </p>
                <p className="text-xs text-[#F0F0FB]/40 mt-1.5 font-semibold leading-relaxed italic tracking-wide">
                  {notification.description}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>


        <div className="mt-4 pt-4 border-t border-white/[0.05]">
          <button className="w-full py-4 rounded-[22px] bg-white/[0.02] border border-white/[0.04] text-[10px] font-black text-[#F0F0FB]/40 hover:bg-primary-blue hover:text-white uppercase tracking-[0.4em] transition-all duration-500">
            Access Full Audit Logs
          </button>
        </div>
      </DropdownMenuContent>

    </DropdownMenu>
  );
}
