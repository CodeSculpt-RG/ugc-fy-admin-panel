"use client";

import React from "react";
import { Plus, UserPlus, ShieldCheck, CreditCard, FileText, Scale, Eye } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

const actions = [
  { label: "Add New Admin", icon: UserPlus, description: "Create a new administrative user" },
  { label: "Review Pending KYC", icon: ShieldCheck, description: "Verify creator identities" },
  { label: "Review Moderation Queue", icon: Eye, description: "Moderate pending content" },
  { label: "Release Pending Payout", icon: CreditCard, description: "Approve escrow releases" },
  { label: "Create Internal Report", icon: FileText, description: "Generate custom data reports" },
  { label: "Open Dispute Case", icon: Scale, description: "Handle creator-brand conflicts" },
];

export default function NewActionMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button 
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 bg-primary-blue text-white px-6 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-blue/25 hover:bg-primary-blue/90 transition-all outline-none group active-nav-glow"
        >
          <div className="p-1 rounded-md bg-white/20 group-hover:bg-white/30 transition-colors">
            <Plus className="w-3 h-3 stroke-[4]" />
          </div>
          <span className="hidden md:inline">New Action</span>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-[#111827] border border-white/10 p-3 rounded-[32px] shadow-2xl overflow-hidden relative"
        sideOffset={16}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/30 to-transparent" />
        
        <div className="px-5 py-5 mb-2 border-b border-white/[0.05]">
          <p className="text-[10px] font-black text-[#F0F0FB]/20 uppercase tracking-[0.5em]">Administrative Tasks</p>
        </div>
        
        <div className="space-y-1 relative z-10">
          {actions.map((action) => (
            <DropdownMenuItem 
              key={action.label}
              className="flex items-center space-x-4 p-4 rounded-[22px] focus:bg-primary-blue focus:text-white cursor-pointer transition-all duration-300 outline-none group border border-transparent focus:border-primary-blue/20"
            >
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] group-focus:bg-white/10 group-focus:border-white/20 transition-all group-focus:scale-110">
                <action.icon className="w-4 h-4 text-primary-blue group-focus:text-white transition-transform group-hover:scale-110" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black tracking-tight text-[#F0F0FB] group-focus:text-white">{action.label}</p>
                <p className="text-[10px] text-[#F0F0FB]/30 font-semibold group-focus:text-white/70 transition-colors truncate uppercase tracking-wider">{action.description}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>

    </DropdownMenu>
  );
}
