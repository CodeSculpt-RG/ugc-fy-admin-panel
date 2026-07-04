"use client";

import React, { useMemo } from "react";
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
  X,
  MessageSquare,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useSidebar } from "@/app/context/SidebarContext";
import { useAuthStore } from "@/app/store/authStore";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { ROUTE_PERMISSIONS } from "@/lib/api/adminPermissions";
const COPY = {
  brandName: "UGC FY",
  platform: "Platform",
} as const;

const menuItems = [
  {
    group: "Main Navigation", items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Creators", href: "/admin/creators", icon: UserSquare2 },
      { name: "Brands", href: "/admin/brands", icon: Building2 },
      { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
      { name: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
      { name: "Chat Monitoring", href: "/admin/chat-monitoring", icon: MessageSquare },
      { name: "Escalations", href: "/admin/escalations", icon: AlertTriangle },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Escrow", href: "/admin/escrow", icon: Lock },
      { name: "Disputes", href: "/admin/disputes", icon: Scale },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { name: "Reports", href: "/admin/reports", icon: FileText },
    ]
  },
  {
    group: "Infrastructure", items: [
      { name: "Cluster Health", href: "/admin/infrastructure", icon: LayoutDashboard },
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
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { logout } = useAuthStore();
  const { admin, hasPermission } = useAdminAuth();

  const handleLogout = () => {
    logout();
  };

  // Filter menu items based on permissions
  const filteredMenuItems = useMemo(() => {
    if (!admin) return [];

    return menuItems.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const entry = Object.entries(ROUTE_PERMISSIONS).find(([route]) => route === item.href);
        const requiredPermission = entry ? entry[1] : undefined;
        if (!requiredPermission) return true; // Allow if no permission defined (e.g. Dashboard)
        return hasPermission(requiredPermission);
      })
    })).filter(group => group.items.length > 0);
  }, [admin, hasPermission]);


  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 88 },
  };

  const mobileVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  const SidebarContent = (
    <div className="flex h-full flex-col w-full min-w-0 min-h-0">
      {/* Logo Section */}
      <div className={cn("shrink-0 p-12 mb-6 flex items-center justify-between", isCollapsed && !isMobileOpen ? "px-6" : "p-12")}>
        <Link href="/admin/dashboard" scroll={false} className="flex items-center space-x-5 group">
          <div className="w-14 h-14 bg-primary rounded-[20px] flex items-center justify-center shadow-glow group-hover:scale-110 transition-all duration-700 flex-shrink-0 relative overflow-hidden">
            <Lock className="text-primary-foreground w-6 h-6 relative z-10" />
            <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-20 transition-opacity" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
          <span className="text-2xl font-black tracking-tighter text-foreground leading-none whitespace-nowrap">
                {COPY.brandName}<span className="text-primary">/</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 mt-1">{COPY.platform}</span>
            </motion.div>
          )}
        </Link>
        {isMobileOpen && (
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-4 rounded-2xl bg-surface-elevated hover:bg-foreground/5 border border-border text-muted-foreground hover:text-foreground transition-all">
            <X className="w-6 h-6" />
          </button>
        )}

      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-8 py-4 space-y-14 scrollbar-hide custom-scrollbar min-h-0">
        {filteredMenuItems.map((group) => (
          <div key={group.group} className="space-y-8">
            {(!isCollapsed || isMobileOpen) && (
              <h3 className="px-5 text-[10px] font-black text-foreground/40 uppercase tracking-[0.5em]">
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
                    scroll={false}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "group flex items-center justify-between px-6 py-4 rounded-[20px] transition-all relative overflow-hidden border border-transparent",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary dark:bg-primary/10 dark:text-primary dark:border-primary/50 shadow-[0_4px_12px_rgba(229,132,35,0.2)] dark:shadow-[0_0_15px_rgba(229,132,35,0.15)] font-bold"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated",
                      isCollapsed && !isMobileOpen && "justify-center px-0"
                    )}
                    title={isCollapsed && !isMobileOpen ? item.name : ""}
                  >
                    <div className="flex items-center space-x-4 relative z-10">
                      <item.icon className={cn(
                        "w-5 h-5 transition-all duration-300 flex-shrink-0 stroke-[2.5]",
                        isActive ? "text-primary-foreground dark:text-primary scale-110" : "text-text-secondary group-hover:text-primary group-hover:scale-110"
                      )} />
                      {(!isCollapsed || isMobileOpen) && (
                        <span className={cn(
                          "text-[13px] font-semibold whitespace-nowrap transition-colors",
                          isActive ? "text-primary-foreground dark:text-primary font-bold" : "text-text-secondary group-hover:text-text-primary"
                        )}>
                          {item.name}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(229,132,35,0.4)]"
                      />
                    )}
                    {(!isCollapsed || isMobileOpen) && (
                      <ChevronRight className={cn(
                        "w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 relative z-10",
                        isActive ? "text-foreground/60" : "text-foreground/20"
                      )} />
                    )}
                  </Link>

                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile Section */}
      <div className="shrink-0 p-5 border-t border-border bg-surface-elevated">
        <div className={cn(
          "bg-surface rounded-2xl p-3 flex items-center justify-between border border-border group hover:border-primary/20 transition-all duration-300 relative overflow-hidden",
          isCollapsed && !isMobileOpen ? "flex-col items-center gap-3 px-2 py-4" : "flex-row gap-3"
        )}>
          {/* Left / Top Side: Avatar & Info */}
          <Link href="/admin/profile" className={cn(
            "flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity",
            isCollapsed && !isMobileOpen ? "flex-col text-center" : "flex-row"
          )}>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 border border-primary/15 flex items-center justify-center text-xs font-black text-primary flex-shrink-0 shadow-sm relative">
              {admin?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={admin.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                admin?.full_name?.slice(0, 2)?.toUpperCase() || admin?.name?.slice(0, 2)?.toUpperCase() || "AD"
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                <p className="text-xs font-black text-foreground truncate leading-none mb-1">{admin?.full_name || admin?.name || admin?.email || "Admin Name"}</p>
                <span className="inline-flex px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider w-max">
                  {admin?.role === "owner" ? "OWNER" : "ADMIN"}
                </span>
              </div>
            )}
          </Link>

          {/* Right / Bottom Side: Logout button */}
          <button 
            onClick={handleLogout}
            className={cn(
              "p-2 text-text-secondary hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-xl transition-all active:scale-95 flex-shrink-0",
              isCollapsed && !isMobileOpen ? "w-full flex items-center justify-center" : ""
            )}
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>



    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Visible >= 1024px) */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        className="hidden lg:flex flex-col h-screen shrink-0 sticky top-0 bg-sidebar-bg border-r border-border z-50 shadow-2xl shadow-black"
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
              className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileVariants}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar-bg border-r border-border z-[70] flex flex-col shadow-2xl"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
