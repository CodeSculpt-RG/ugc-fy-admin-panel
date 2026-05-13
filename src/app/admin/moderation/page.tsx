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
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { ModerationItem } from "@/app/types";

const items: ModerationItem[] = [
  { id: 1, type: "Video", title: "Unboxing SuperPhone 15", creator: "Alex Rivera", campaign: "Tech Launch 2026", status: "AI Flagged", risk: "Medium", thumbnail: "/placeholder-v1.jpg", timestamp: "2h ago" },
  { id: 2, type: "Bio", title: "Creator Profile Update", creator: "Sarah Chen", campaign: "N/A", status: "Pending Review", risk: "Low", content: "Professional lifestyle creator with 5 years exp...", timestamp: "5h ago" },
  { id: 3, type: "Video", title: "Morning Workout Routine", creator: "Marcus Thorne", campaign: "FitLife Summer", status: "Pending Review", risk: "Low", thumbnail: "/placeholder-v1.jpg", timestamp: "1d ago" },
  { id: 4, type: "Comment", title: "Response to Brand", creator: "Elena Gomez", campaign: "Beauty Glow", status: "User Reported", risk: "High", content: "This is a direct response to the brand's requirement...", timestamp: "10m ago" },
];

export default function ModerationPage() {
  const [filter, setFilter] = useState("All Items");

  const filteredItems = items.filter(item => 
    filter === "All Items" || item.status === filter
  );

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-soft-white">Moderation Queue</h1>
            <p className="text-soft-white/40 mt-1">Review flagged and pending content across the marketplace.</p>
          </div>
          <div className="flex items-center space-x-4 bg-dark-surface/50 p-2 rounded-2xl border border-white/5">
             <div className="flex items-center space-x-2 px-3 border-r border-white/10">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span className="text-xs font-bold text-soft-white">452 Cleared</span>
             </div>
             <div className="flex items-center space-x-2 px-3">
                <ShieldAlert className="w-4 h-4 text-error" />
                <span className="text-xs font-bold text-soft-white">12 Flagged</span>
             </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {["All Items", "AI Flagged", "User Reported", "Pending Review", "Restricted"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-bold transition-all border",
                filter === tab 
                  ? "bg-primary-blue border-primary-blue text-white shadow-lg shadow-primary-blue/20" 
                  : "bg-white/5 border-white/10 text-soft-white/40 hover:text-soft-white hover:bg-white/10"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-dark-surface/50 backdrop-blur-sm border border-white/5 rounded-[24px] overflow-hidden group hover:border-primary-blue/30 transition-all"
            >
              {/* Media Preview */}
              <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center">
                {item.type === "Video" ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div className="absolute top-4 left-4 z-20 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                      {item.type}
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center italic text-soft-white/40 text-sm">
                    &quot;{item.content}&quot;
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-soft-white truncate leading-tight">{item.title}</h3>
                    <p className="text-[10px] text-soft-white/30 uppercase font-bold tracking-widest mt-1">{item.campaign}</p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border",
                    item.risk === "High" ? "bg-error/10 text-error border-error/20" : 
                    item.risk === "Medium" ? "bg-warning/10 text-warning border-warning/20" : 
                    "bg-success/10 text-success border-success/20"
                  )}>
                    {item.risk} Risk
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-blue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-soft-white truncate">{item.creator}</p>
                    <p className="text-[10px] text-soft-white/30">Creator</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1 text-soft-white/30">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">{item.timestamp}</span>
                  </div>
                  <div className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    item.status === "AI Flagged" ? "text-error" : "text-warning"
                  )}>
                    {item.status}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button className="flex items-center justify-center space-x-2 bg-success/10 hover:bg-success text-success hover:text-white border border-success/20 py-2.5 rounded-xl transition-all text-xs font-bold">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 bg-error/10 hover:bg-error text-error hover:text-white border border-error/20 py-2.5 rounded-xl transition-all text-xs font-bold">
                    <ThumbsDown className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
                <button className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-soft-white/60 hover:text-soft-white border border-white/10 py-2.5 rounded-xl transition-all text-xs font-bold">
                  <Flag className="w-4 h-4" />
                  <span>Escalate</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
