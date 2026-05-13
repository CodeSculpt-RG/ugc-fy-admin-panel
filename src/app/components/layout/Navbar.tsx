"use client";

import React from "react";
import { Search, Bell, Menu, Plus, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <nav className="h-20 bg-black/50 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-8 flex-1">
        <button className="lg:hidden text-soft-white/60">
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-white/30 group-focus-within:text-primary-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Search campaigns, users, or transactions..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-soft-white placeholder:text-soft-white/20 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue/30 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold text-soft-white/40">⌘</span>
            <span className="text-[10px] font-bold text-soft-white/40">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Quick Action */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-primary-blue to-primary-blue/80 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary-blue/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Action</span>
        </motion.button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-soft-white/60 hover:text-soft-white hover:bg-white/10 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-orange rounded-full border-2 border-black" />
        </button>

        {/* Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <Zap className="w-3 h-3 text-success fill-success" />
          <span className="text-[10px] font-bold text-success uppercase tracking-wider">System Live</span>
        </div>
      </div>
    </nav>
  );
}
