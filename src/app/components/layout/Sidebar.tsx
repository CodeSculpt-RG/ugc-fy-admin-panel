"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Megaphone,
  ShieldCheck,
  CircleDollarSign,
  LifeBuoy,
  Settings,
  UserSquare2,
  History,
  ShieldAlert,
  LogOut,
  X,
  Lock
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useSidebar } from "@/app/context/SidebarContext";
import { useAuthStore } from "@/app/store/authStore";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { ROUTE_PERMISSIONS } from "@/lib/api/adminPermissions";

const menuGroups = [
  {
    group: "Primary", items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "KYC", href: "/admin/kyc", icon: ClipboardCheck },
      { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
      { name: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
    ]
  },
  {
    group: "Operations", items: [
      { name: "Finance", href: "/admin/finance", icon: CircleDollarSign },
      { name: "Support", href: "/admin/support", icon: LifeBuoy },
    ]
  },
  {
    group: "Admin / Security", items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Admins", href: "/admin/settings/admins", icon: UserSquare2 },
      { name: "Security Logs", href: "/admin/settings/security-logs", icon: History },
      { name: "Bans", href: "/admin/settings/bans", icon: ShieldAlert },
    ]
  }
];

import { LucideIcon } from "lucide-react";

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/admin/dashboard") {
    return pathname === href;
  }
  // For generic settings, only active if exactly /admin/settings 
  // (so specific nested settings routes don't highlight generic one if rendered)
  if (href === "/admin/settings") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarFlyoutLabel({
  label,
  icon: Icon,
  danger = false,
}: {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-[100]",
        "flex -translate-y-1/2 translate-x-2 items-center gap-2 whitespace-nowrap",
        "rounded-2xl border px-3.5 py-2 text-xs font-semibold shadow-[0_18px_45px_rgba(0,0,0,0.22)]",
        "opacity-0 backdrop-blur-xl transition-all duration-200 ease-out",
        "group-hover:translate-x-0 group-hover:opacity-100",
        "group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
        danger
          ? "border-red-500/20 bg-red-600 text-white"
          : "border-white/15 bg-neutral-950 text-white"
      )}
    >
      <span
        className={cn(
          "absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45",
          danger ? "bg-red-600" : "bg-neutral-950"
        )}
      />
      <Icon className="relative z-10 h-3.5 w-3.5" />
      <span className="relative z-10">{label}</span>
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const { logout } = useAuthStore();
  const { admin, hasPermission } = useAdminAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, setIsMobileOpen]);

  const filteredMenuGroups = useMemo(() => {
    if (!admin) return [];
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const entry = Object.entries(ROUTE_PERMISSIONS).find(([route]) => route === item.href);
        const requiredPermission = entry ? entry[1] : undefined;
        if (!requiredPermission) return true;
        return hasPermission(requiredPermission);
      })
    })).filter(group => group.items.length > 0);
  }, [admin, hasPermission]);

  const adminInitials = admin?.full_name?.slice(0, 2)?.toUpperCase() || admin?.name?.slice(0, 2)?.toUpperCase() || "UG";

  const DesktopSidebar = (
    <aside className="hidden shrink-0 px-4 py-4 lg:block">
      <nav className="sticky top-4 flex h-[calc(100vh-32px)] w-[88px] flex-col items-center rounded-[34px] border border-white/75 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl overflow-visible">
        
        {/* Logo */}
        <div className="shrink-0 mb-6 mt-6">
          <Link
            href="/admin/dashboard"
            aria-label="UGCFY Admin Dashboard"
            className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-[0_16px_36px_rgba(0,0,0,0.20)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 relative"
          >
            <Lock className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-500 ring-2 ring-white" />
          </Link>
        </div>

        {/* Nav Items */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-visible scrollbar-hide flex flex-col items-center gap-6 pb-4">
          {filteredMenuGroups.map((group, groupIdx) => (
            <div key={group.group} className="flex flex-col items-center gap-2 relative w-full">
              {groupIdx > 0 && <div className="absolute -top-3 h-px w-8 bg-black/5" />}
              {group.items.map((item) => {
                const isActive = isRouteActive(pathname, item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-label={item.name}
                    title={item.name}
                    className={cn(
                      "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2",
                      isActive
                        ? "bg-neutral-950 text-white shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                        : "text-neutral-500 hover:-translate-y-0.5 hover:bg-white hover:text-neutral-950 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {isActive && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
                    )}
                    <SidebarFlyoutLabel label={item.name} icon={item.icon} />
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Profile / Logout */}
        <div className="mt-auto flex w-full flex-col items-center gap-3 border-t border-black/5 px-2 pt-4 pb-4">
          <Link
            href="/admin/profile"
            aria-label="Owner admin profile"
            title="Owner admin profile"
            className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xs font-bold text-orange-600 ring-1 ring-orange-100 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2"
          >
            {adminInitials}
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            <SidebarFlyoutLabel label="Admin Profile" icon={UserSquare2} />
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            title="Logout"
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          >
            <LogOut className="h-4 w-4" />
            <SidebarFlyoutLabel label="Logout" icon={LogOut} danger />
          </button>
        </div>
      </nav>
    </aside>
  );

  const mobileVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  const MobileSidebar = (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
          />
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileVariants}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 z-[70] w-[288px] border-r border-white/70 bg-white/92 p-4 shadow-2xl backdrop-blur-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 pt-2 px-2">
               <div className="flex items-center gap-3 text-neutral-950">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-white shadow-md relative">
                    <Lock className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-500 ring-2 ring-white" />
                  </div>
                  <span className="font-bold tracking-tight text-lg">UGCFY</span>
               </div>
               <button 
                 aria-label="Close menu" 
                 onClick={() => setIsMobileOpen(false)} 
                 className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-neutral-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            <nav className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-6 px-2 pb-4">
              {filteredMenuGroups.map((group) => (
                <div key={group.group} className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1 ml-2">{group.group}</span>
                  {group.items.map((item) => {
                    const isActive = isRouteActive(pathname, item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40",
                          isActive
                            ? "bg-neutral-950 text-white shadow-md"
                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-black/5 pt-4 px-2 flex items-center justify-between">
              <Link href="/admin/profile" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 rounded-xl p-1 pr-3 hover:bg-black/5 transition">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-xs font-bold text-orange-600 ring-1 ring-orange-100 group-hover:bg-orange-100 transition">
                  {adminInitials}
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-950">{admin?.full_name || admin?.name || admin?.email || "Admin"}</span>
                  <span className="text-[10px] font-semibold uppercase text-neutral-500">Owner</span>
                </div>
              </Link>

              <button
                type="button"
                onClick={logout}
                aria-label="Logout"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
    </>
  );
}
