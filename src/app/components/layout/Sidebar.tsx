"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  ChevronRight
} from "lucide-react";
import { cn } from "@/app/lib/utils";

const menuItems = [
  { group: "Main Navigation", items: [
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
  ]},
  { group: "System", items: [
    { name: "Admin Management", href: "/admin/admin-management", icon: UserSquare2 },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: History },
    { name: "Security", href: "/admin/security", icon: ShieldAlert },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]}
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-dark-surface border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo Section */}
      <div className="p-8">
        <Link href="/admin/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-accent-orange rounded-xl flex items-center justify-center shadow-lg shadow-primary-blue/20 group-hover:scale-110 transition-transform">
            <Lock className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-soft-white">
            UGC FY <span className="text-primary-blue font-black">/</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-hide">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            <h3 className="px-4 text-[10px] font-bold text-soft-white/30 uppercase tracking-[0.2em]">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between px-4 py-3 rounded-xl transition-all relative",
                      isActive 
                        ? "bg-primary-blue/10 text-primary-blue" 
                        : "text-soft-white/60 hover:text-soft-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-primary-blue" : "text-soft-white/40 group-hover:text-soft-white"
                      )} />
                      <span className="text-sm font-medium tracking-wide">{item.name}</span>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 w-1 h-6 bg-primary-blue rounded-r-full"
                      />
                    )}
                    <ChevronRight className={cn(
                      "w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1",
                      isActive ? "text-primary-blue opacity-100" : "text-soft-white/20"
                    )} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile Section */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-black/20 rounded-2xl p-4 flex items-center space-x-3 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-xs font-bold text-soft-white">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-soft-white truncate">John Doe</p>
            <p className="text-[10px] text-soft-white/40 uppercase tracking-wider">Super Admin</p>
          </div>
          <button className="text-soft-white/20 hover:text-error transition-colors">
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
