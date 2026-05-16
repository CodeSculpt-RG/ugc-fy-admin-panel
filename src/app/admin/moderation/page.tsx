"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ThumbsUp, 
  ThumbsDown, 
  Flag,
  Clock,
  User,
  Play
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/core";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { ModerationItem } from "@/app/types";

import { moderationService } from "@/app/services/moderationService";
import { useToast } from "@/app/hooks/useToast";

export default function ModerationPage() {
  const [filter, setFilter] = useState("All Items");
  const { showToast } = useToast();
  const [localItems, setLocalItems] = useState<ModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const loadQueue = async () => {
      try {
        const data = await moderationService.getQueue();
        setLocalItems(data);
      } catch (error) {
        console.error("[ModerationPage] Failed to fetch queue:", error);
        showToast("Infrastructure synchronization failed.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadQueue();
  }, [showToast]);

  const filteredItems = localItems.filter(item => 
    filter === "All Items" || item.status === filter
  );

  const handleApprove = async (id: string) => {
    try {
      await moderationService.approve(id);
      showToast(`Asset ${id} approved`, "success");
      setLocalItems(prev => prev.filter(item => item.id !== id));
    } catch {
      showToast("Approval protocol failed", "error");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await moderationService.reject(id, "Content violates platform guidelines");
      showToast(`Asset ${id} rejected`, "warning");
      setLocalItems(prev => prev.filter(item => item.id !== id));
    } catch {
      showToast("Rejection protocol failed", "error");
    }
  };


  return (
    <DashboardShell>
      <div className="section-spacing">
        {/* Header */}
        <PageHeader 
          title="Security Protocols" 
          subtitle="Enterprise-grade moderation of platform assets and ecosystem interactions."
        >
          <div className="flex items-center space-x-6 p-2.5 bg-[#111827] border border-white/10 rounded-[24px] shadow-inner">
             <div className="flex items-center space-x-3 px-4 border-r border-white/[0.05]">
                <ShieldCheck className="w-4 h-4 text-success-green" />
                <span className="text-[11px] font-black text-[#F0F0FB]/40 uppercase tracking-widest">452 Cleared</span>
             </div>
             <div className="flex items-center space-x-3 px-4">
                <ShieldAlert className="w-4 h-4 text-error" />
                <span className="text-[11px] font-black text-[#F0F0FB]/40 uppercase tracking-widest">12 Flagged</span>
             </div>
          </div>

        </PageHeader>

        {/* Filters */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-hide">
          {["All Items", "AI Flagged", "User Reported", "Pending Review", "Restricted"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                filter === tab 
                  ? "bg-primary-blue border-primary-blue text-white shadow-xl shadow-primary-blue/20" 
                  : "bg-[#111827] border-white/[0.08] text-[#F0F0FB]/30 hover:text-[#F0F0FB] hover:bg-white/[0.04]"

              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F0F0FB]/20 animate-pulse">Synchronizing Asset Ledger...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F0F0FB]/20">No assets pending moderation.</span>
            </div>
          ) : filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] overflow-hidden group hover:border-primary-blue/30 transition-all duration-500 shadow-premium interactive-card flex flex-col relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Media Preview */}
              <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center shrink-0">
                {item.type === "Video" ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60" />
                    <div className="z-20 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                    <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-widest">
                      {item.type}
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center italic text-[#F0F0FB]/40 text-xs font-medium leading-relaxed">
                    &quot;{item.content}&quot;
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-[#F0F0FB] truncate tracking-tight">{item.title}</h3>
                    <p className="text-[9px] text-[#F0F0FB]/20 uppercase font-black tracking-widest mt-1.5">{item.campaign}</p>
                  </div>

                  <div className={cn(
                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0",
                    item.risk === "High" ? "bg-error/10 text-error border-error/20" : 
                    item.risk === "Medium" ? "bg-warning/10 text-warning border-warning/20" : 
                    "bg-success-green/10 text-success-green border-success-green/20"
                  )}>
                    {item.risk} Risk
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary-blue/10 border border-primary-blue/15 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-blue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#F0F0FB] truncate tracking-tight">{item.creator}</p>
                    <p className="text-[9px] text-[#F0F0FB]/20 font-black uppercase tracking-widest mt-0.5">Entity Profile</p>
                  </div>
                </div>


                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2 text-[#F0F0FB]/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.timestamp}</span>
                  </div>

                  <div className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    item.status === "AI Flagged" ? "text-error" : "text-warning"
                  )}>
                    {item.status}
                  </div>
                </div>

                <div className="mt-auto space-y-4 pt-6">
                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleApprove(item.id)}
                      className="flex items-center justify-center space-x-2 bg-primary-blue text-white hover:bg-primary-blue/90 py-3.5 rounded-2xl transition-all shadow-lg shadow-primary-blue/20 active:scale-95 text-[10px] font-black uppercase tracking-widest"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button 
                      onClick={() => handleReject(item.id)}
                      className="flex items-center justify-center space-x-2 bg-white/[0.03] border border-white/10 text-[#F0F0FB]/40 hover:bg-error hover:text-white hover:border-error py-3.5 rounded-2xl transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <button className="w-full flex items-center justify-center space-x-2 bg-white/[0.02] border border-white/10 text-[#F0F0FB]/30 hover:text-[#F0F0FB] py-3.5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest group shadow-sm">
                    <Flag className="w-3.5 h-3.5 group-hover:text-error transition-colors" />
                    <span>Escalate Incident</span>
                  </button>

                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
