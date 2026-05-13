"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Terminal, 
  User as UserIcon, 
  Shield, 
  Clock,
  Database,
  Globe,
  Monitor
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { AuditLog } from "@/app/types";

const mockLogs: AuditLog[] = [
  { id: "LOG-901", admin: "Rahul S.", action: "Blocked User", target: "Marcus Thorne", timestamp: "2026-05-12 14:30:22", ip: "103.21.12.84", severity: "Critical", module: "Users", device: "iPhone 15" },
  { id: "LOG-902", admin: "System", action: "Campaign Approval", target: "Summer Tech Blast", timestamp: "2026-05-12 13:15:00", ip: "Internal", severity: "Info", module: "Campaigns", device: "Server" },
  { id: "LOG-903", admin: "Priya K.", action: "Released Escrow", target: "ESC-103", timestamp: "2026-05-12 12:45:10", ip: "115.24.56.21", severity: "Warning", module: "Escrow", device: "MacBook Pro" },
  { id: "LOG-904", admin: "Rahul S.", action: "Updated Settings", target: "Email SMTP", timestamp: "2026-05-12 11:20:05", ip: "103.21.12.84", severity: "Warning", module: "Settings", device: "iPhone 15" },
  { id: "LOG-905", admin: "Anjali M.", action: "Login Success", target: "Admin Panel", timestamp: "2026-05-12 09:00:12", ip: "152.12.44.18", severity: "Info", module: "Auth", device: "Windows Desktop" },
];

export default function AuditLogsPage() {
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 text-[10px] font-mono text-soft-white/40">
          <Clock className="w-3 h-3" />
          <span>{row.original.timestamp}</span>
        </div>
      ),
    },
    {
      accessorKey: "admin",
      header: "Admin User",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <UserIcon className="w-3 h-3 text-soft-white/60" />
          </div>
          <span className="text-xs font-bold text-soft-white">{row.original.admin}</span>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-primary-blue" />
          <span className="text-xs font-bold text-soft-white">{row.original.action}</span>
        </div>
      ),
    },
    {
      accessorKey: "target",
      header: "Target Entity",
      cell: ({ row }) => <span className="text-xs text-soft-white/60">{row.original.target}</span>,
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => (
        <span className={cn(
          "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
          row.original.severity === "Critical" ? "bg-error/10 text-error" : 
          row.original.severity === "Warning" ? "bg-warning/10 text-warning" : 
          "bg-success/10 text-success"
        )}>
          {row.original.severity}
        </span>
      ),
    },
    {
      accessorKey: "ip",
      header: "Origin IP",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 text-[10px] text-soft-white/30 font-mono">
          <Globe className="w-3 h-3" />
          <span>{row.original.ip}</span>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <PageHeader 
        title="Security Audit Logs" 
        subtitle="Unchangeable history of all administrative actions and system events."
      >
        <Button variant="outline" className="bg-white/5 border-white/10 text-soft-white rounded-xl h-12">
          Stream Logs
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
         <div className="p-6 rounded-3xl bg-dark-surface border border-white/5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20">
               <Shield className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-soft-white/30">Auth Events</p>
               <h4 className="text-lg font-bold text-soft-white">2,482</h4>
            </div>
         </div>
         <div className="p-6 rounded-3xl bg-dark-surface border border-white/5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20">
               <Database className="w-6 h-6 text-accent-orange" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-soft-white/30">DB Mutations</p>
               <h4 className="text-lg font-bold text-soft-white">124</h4>
            </div>
         </div>
         <div className="p-6 rounded-3xl bg-dark-surface border border-white/5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center border border-success/20">
               <Monitor className="w-6 h-6 text-success" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-soft-white/30">System Status</p>
               <h4 className="text-lg font-bold text-soft-white">Nominal</h4>
            </div>
         </div>
      </div>

      <DataTable 
        columns={columns} 
        data={mockLogs} 
        searchKey="action"
        placeholder="Filter logs by action..."
      />
    </DashboardShell>
  );
}

import { cn } from "@/app/lib/utils";
