"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Building2,
  Megaphone,
  ShieldCheck,
  CreditCard,
  Lock,
  Scale,
  BarChart3,
  FileText,
  Settings,
  History,
  ShieldAlert,
  ChevronRight,
  LogOut,
  X
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useSidebar } from "@/app/context/SidebarContext";
import { useAuthStore } from "@/app/store/authStore";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";


const menuItems = [
  {
    group: "Main Navigation", items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Creators", href: "/admin/creators", icon: UserSquare2 },
      { name: "Brands", href: "/admin/brands", icon: Building2 },
      { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
      { name: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Escrow", href: "/admin/escrow", icon: Lock },
      { name: "Disputes", href: "/admin/disputes", icon: Scale },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { name: "Reports", href: "/admin/reports", icon: FileText },
    ]
  },
  {
    group: "Infrastructure", items: [
      { name: "Admin Management", href: "/admin/admin-management", icon: UserSquare2 },
      { name: "Audit Logs", href: "/admin/audit-logs", icon: History },
      { name: "Security", href: "/admin/security", icon: ShieldAlert },
      { name: "Settings", href: "/admin/settings", icon: Settings },
      ...(process.env.NODE_ENV === "development" ? [
        { name: "Debug Connection", href: "/admin/debug-connection", icon: LayoutDashboard }
      ] : []),
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    deleteCookie("admin-token");
    logout();
    router.push("/admin/login");
  };


  const sidebarVariants = {
    expanded: { width: 300 },
    collapsed: { width: 88 },
  };

  const mobileVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  const SidebarContent = (
    <>
      {/* Logo Section */}
      <div className={cn("p-12 mb-6 flex items-center justify-between", isCollapsed && !isMobileOpen ? "px-6" : "p-12")}>
        <Link href="/admin/dashboard" className="flex items-center space-x-5 group">
          <div className="w-14 h-14 bg-primary-blue rounded-[20px] flex items-center justify-center shadow-blue-glow group-hover:scale-110 transition-all duration-700 flex-shrink-0 relative overflow-hidden">
            <Lock className="text-white w-6 h-6 relative z-10" />
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
          <span className="text-2xl font-black tracking-tighter text-[#F0F0FB] leading-none whitespace-nowrap">
                UGC FY<span className="text-primary-blue">/</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F0F0FB]/20 mt-1">Platform</span>
            </motion.div>
          )}
        </Link>
        {isMobileOpen && (
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-[#F0F0FB]/20 hover:text-[#F0F0FB] transition-all">
            <X className="w-6 h-6" />
          </button>
        )}

      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-8 py-4 space-y-14 scrollbar-hide custom-scrollbar">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-8">
            {(!isCollapsed || isMobileOpen) && (
              <h3 className="px-5 text-[10px] font-black text-[#F0F0FB]/10 uppercase tracking-[0.5em]">
                {group.group}
              </h3>
            )}
            <div className="space-y-3">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "group flex items-center justify-between px-6 py-4.5 rounded-[24px] transition-all relative overflow-hidden",
                      isActive
                        ? "bg-primary-blue text-white active-nav-glow shadow-lg shadow-primary-blue/30"
                        : "text-[#F0F0FB]/30 hover:text-[#F0F0FB] hover:bg-white/[0.04]",
                      isCollapsed && !isMobileOpen && "justify-center px-0"
                    )}
                    title={isCollapsed && !isMobileOpen ? item.name : ""}
                  >
                    <div className="flex items-center space-x-5 relative z-10">
                      <item.icon className={cn(
                        "w-5 h-5 transition-all duration-500 flex-shrink-0 stroke-[2.5]",
                        isActive ? "text-white scale-110" : "text-[#F0F0FB]/20 group-hover:text-primary-blue group-hover:scale-110"
                      )} />
                      {(!isCollapsed || isMobileOpen) && (
                        <span className={cn(
                          "text-[12px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-colors",
                          isActive ? "text-white" : "text-[#F0F0FB]/40 group-hover:text-[#F0F0FB]"
                        )}>
                          {item.name}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 w-1.5 h-10 bg-white rounded-r-full shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      />
                    )}
                    {(!isCollapsed || isMobileOpen) && (
                      <ChevronRight className={cn(
                        "w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 relative z-10",
                        isActive ? "text-white/40" : "text-[#F0F0FB]/5"
                      )} />
                    )}
                  </Link>

                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile Section */}
      <div className="p-8 border-t border-white/[0.08]">
        <div className={cn(
          "bg-[#0F172A] rounded-[32px] p-6 flex items-center space-x-5 border border-white/10 group hover:border-white/20 hover:bg-white/[0.04] transition-all relative overflow-hidden",
          isCollapsed && !isMobileOpen ? "flex-col space-x-0 space-y-5 px-4" : "flex-row"
        )}>
          <div className="w-14 h-14 rounded-[20px] bg-primary-blue/10 border border-primary-blue/20 flex items-center justify-center text-[12px] font-black text-primary-blue flex-shrink-0 group-hover:scale-110 transition-all duration-500 uppercase">
            {user?.name?.slice(0, 2) || "AD"}
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-[#F0F0FB] truncate tracking-tighter capitalize">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-[#F0F0FB]/20 uppercase font-black tracking-[0.3em] mt-1">{user?.role?.replace("_", " ") || "Administrator"}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-3.5 text-[#F0F0FB]/10 hover:text-accent-orange hover:bg-accent-orange/10 rounded-2xl transition-all group/logout"
          >
            <LogOut className="w-4.5 h-4.5 group-hover/logout:scale-125 transition-all duration-500" />
          </button>
        </div>
      </div>



    </>
  );

  return (
    <>
      {/* Desktop Sidebar (Visible >= 1024px) */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        className="hidden lg:flex flex-col h-screen bg-[#020617] border-r border-white/[0.08] fixed left-0 top-0 z-50 overflow-hidden shadow-2xl shadow-black"
      >
        {SidebarContent}
      </motion.aside>

      {/* Mobile Drawer (Visible < 1024px) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileVariants}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[300px] bg-[#020617] border-r border-white/[0.08] z-[70] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
