"use client";

import React, { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/app/context/SidebarContext";
import NotificationDropdown from "./NotificationDropdown";
import NewActionMenu from "./NewActionMenu";
import SystemStatusPopover from "./SystemStatusPopover";
import { cn } from "@/app/lib/utils";

export default function Navbar() {
  const { toggleMobileMenu, toggleSidebar, isCollapsed } = useSidebar();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <nav className="h-28 bg-[#030712]/80 premium-blur border-b border-white/[0.08] px-8 md:px-12 lg:px-20 flex items-center justify-between sticky top-0 z-50 transition-all duration-700">

      <div className="flex items-center space-x-8 lg:space-x-12 flex-1">
        {/* Mobile Hamburger (Visible < 1024px) */}
        <button 
          onClick={toggleMobileMenu}
          className="lg:hidden p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[#F0F0FB]/20 hover:text-[#F0F0FB] hover:bg-white/5 transition-all active:scale-90"
        >
          <Menu className="w-6 h-6" />
        </button>


        {/* Search Bar */}
        <div className={cn(
          "relative w-full max-w-2xl group transition-all duration-700",
          isSearchFocused ? "max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[60] max-lg:p-8 max-lg:bg-[#030712] max-lg:h-28 max-lg:max-w-none" : "max-lg:max-w-[52px]"
        )}>
          <div className={cn(
            "absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none transition-all duration-500",
            isSearchFocused ? "text-primary-blue scale-125" : "text-[#F0F0FB]/10"
          )}>
            <Search className="w-4.5 h-4.5 stroke-[3]" />
          </div>

          <input 
            type="text" 
            placeholder="Query operational infrastructure..." 
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "w-full bg-[#111827] border border-white/[0.05] rounded-2xl py-4 pl-16 pr-8 text-xs font-black text-[#F0F0FB] placeholder:text-[#F0F0FB]/10 focus:outline-none focus:ring-2 focus:ring-primary-blue/40 focus:ring-offset-2 focus:ring-offset-[#030712] focus:border-primary-blue/10 focus:bg-[#030712] transition-all duration-700 tracking-wider",
              isSearchFocused ? "max-lg:h-14 max-lg:bg-[#111827] shadow-premium-hover" : "max-lg:w-0 max-lg:p-0 max-lg:border-0 max-lg:bg-transparent"
            )}
          />

          {!isSearchFocused && (
            <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 items-center space-x-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-all duration-500">
              <span className="text-[10px] font-black text-[#F0F0FB]/10">⌘</span>
              <span className="text-[10px] font-black text-[#F0F0FB]/10">K</span>
            </div>

          )}
          {isSearchFocused && (
            <button 
              className="lg:hidden absolute right-12 top-1/2 -translate-y-1/2 text-[#F0F0FB]/20 p-4"
              onClick={() => setIsSearchFocused(false)}
            >
              <X className="w-7 h-7" />
            </button>

          )}
        </div>
      </div>

      <div className="flex items-center space-x-6 md:space-x-10 ml-8">
        {/* Quick Action */}
        <div className="relative group">
          <NewActionMenu />
        </div>

        <div className="h-12 w-px bg-white/[0.03] hidden sm:block mx-2" />


        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Status Indicator */}
          <SystemStatusPopover />
        </div>
      </div>
    </nav>
  );
}
