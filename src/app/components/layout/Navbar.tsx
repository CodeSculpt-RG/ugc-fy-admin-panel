"use client";

import React, { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { useSidebar } from "@/app/context/SidebarContext";
import NotificationDropdown from "./NotificationDropdown";
import NewActionMenu from "./NewActionMenu";
import SystemStatusPopover from "./SystemStatusPopover";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/app/lib/utils";

export default function Navbar() {
  const { toggleMobileMenu } = useSidebar();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <nav className="h-[84px] bg-background/80 premium-blur border-b border-border px-8 md:px-12 lg:px-20 flex items-center justify-between sticky top-0 z-50 transition-all duration-700">

      <div className="flex items-center space-x-8 lg:space-x-12 flex-1">
        {/* Mobile Hamburger (Visible < 1024px) */}
        <button 
          onClick={toggleMobileMenu}
          className="lg:hidden p-4 rounded-2xl bg-surface-elevated border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all active:scale-90"
        >
          <Menu className="w-6 h-6" />
        </button>


        {/* Search Bar */}
        <div className={cn(
          "relative w-full max-w-2xl group transition-all duration-700",
          isSearchFocused ? "max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[60] max-lg:p-8 max-lg:bg-background max-lg:h-28 max-lg:max-w-none" : "max-lg:max-w-[52px]"
        )}>
          <div className={cn(
            "absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none transition-all duration-500",
            isSearchFocused ? "text-primary scale-125" : "text-foreground/40"
          )}>
            <Search className="w-4.5 h-4.5 stroke-[3]" />
          </div>

          <input 
            type="text" 
            placeholder="Query operational infrastructure..." 
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "w-full bg-surface-elevated border border-border rounded-full py-3.5 pl-16 pr-8 text-xs font-medium text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background focus:border-primary/20 transition-all duration-700",
              isSearchFocused ? "max-lg:h-14 shadow-sm" : "max-lg:w-0 max-lg:p-0 max-lg:border-0 max-lg:bg-transparent"
            )}
          />

          {!isSearchFocused && (
            <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 items-center space-x-2 px-3 py-2 rounded-xl bg-surface-elevated border border-border group-hover:border-border transition-all duration-500">
              <span className="text-[10px] font-black text-foreground/40">⌘</span>
              <span className="text-[10px] font-black text-foreground/40">K</span>
            </div>

          )}
          {isSearchFocused && (
            <button 
              className="lg:hidden absolute right-12 top-1/2 -translate-y-1/2 text-foreground/40 p-4"
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

        <div className="h-12 w-px bg-surface-elevated hidden sm:block mx-2" />


        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationDropdown />

          {/* Status Indicator */}
          <SystemStatusPopover />
        </div>
      </div>
    </nav>
  );
}
