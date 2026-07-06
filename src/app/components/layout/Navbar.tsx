"use client";

import React, { useState } from "react";
import { Search, Menu } from "lucide-react";
import { useSidebar } from "@/app/context/SidebarContext";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import NotificationDropdown from "./NotificationDropdown";
import NewActionMenu from "./NewActionMenu";
import SystemStatusPopover from "./SystemStatusPopover";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/app/lib/utils";

export default function Navbar() {
  const { toggleMobileMenu } = useSidebar();
  const { admin } = useAdminAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const roleLabel =
    admin?.role === "owner"
      ? "Owner Admin"
      : admin?.role
        ? `${admin.role.charAt(0).toUpperCase()}${admin.role.slice(1)} Admin`
        : "Admin";

  return (
    <header className="mb-4 flex items-center justify-between gap-3">
      {/* Left side: Menu toggle (Mobile only) + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-neutral-600 shadow-sm transition hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-xs font-extrabold tracking-tight text-white shadow-[0_14px_34px_rgba(0,0,0,0.20)]">
            UG
          </div>

          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-extrabold tracking-[0.18em] text-orange-600">
              UGCFY
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Search + Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Compact Search */}
        <div className={cn(
          "hidden lg:flex relative items-center transition-all duration-300",
          isSearchFocused ? "w-[380px]" : "w-[320px]"
        )}>
          <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none transition-colors",
            isSearchFocused ? "text-orange-600" : "text-neutral-400"
          )}>
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>
          <input 
            type="text" 
            placeholder="Search operations..." 
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="h-11 w-full rounded-full border border-white/70 bg-white/70 py-2 pl-10 pr-12 text-sm font-medium text-neutral-900 shadow-sm outline-none backdrop-blur-xl transition-all placeholder:text-neutral-500 focus:border-white focus:bg-white focus:ring-2 focus:ring-orange-500/30"
          />
          {!isSearchFocused && (
             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60">
                <span className="text-[10px] font-bold text-neutral-500">⌘</span>
                <span className="text-[10px] font-bold text-neutral-500">K</span>
             </div>
          )}
        </div>

        {/* Mobile Search Toggle */}
        <button 
          aria-label="Search"
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-neutral-600 shadow-sm transition hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="hidden sm:block h-6 w-px bg-black/10 mx-1" />

        <NewActionMenu />
        <ThemeToggle />
        <NotificationDropdown />
        <SystemStatusPopover />
      </div>
    </header>
  );
}
