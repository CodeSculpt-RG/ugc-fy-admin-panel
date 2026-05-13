"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  MoreVertical,
  User as UserIcon,
  Fingerprint
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { AdminUser } from "@/app/types";

const mockAdmins: AdminUser[] = [
  { id: 1, name: "Rahul S.", email: "rahul@ugc-fy.in", role: "SUPER_ADMIN", lastActive: "Active Now", status: "Active" },
  { id: 2, name: "Priya K.", email: "priya@ugc-fy.in", role: "FINANCE_ADMIN", lastActive: "2h ago", status: "Active" },
  { id: 3, name: "Anjali M.", email: "anjali@ugc-fy.in", role: "MODERATION_ADMIN", lastActive: "1d ago", status: "Active" },
  { id: 4, name: "Vikram R.", email: "vikram@ugc-fy.in", role: "SUPPORT_ADMIN", lastActive: "5d ago", status: "Suspended" },
];

export default function AdminManagementPage() {
  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "name",
      header: "Administrator",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center border border-primary-blue/30">
            <UserIcon className="w-4 h-4 text-primary-blue" />
          </div>
          <div>
            <p className="text-sm font-bold text-soft-white">{row.original.name}</p>
            <p className="text-[10px] text-soft-white/30 uppercase font-black">{row.original.id}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email Address",
      cell: ({ row }) => <span className="text-xs text-soft-white/60">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Role / Permission",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <ShieldCheck className={cn(
            "w-3.5 h-3.5",
            row.original.role === "SUPER_ADMIN" ? "text-primary-blue" : "text-soft-white/20"
          )} />
          <span className="text-xs font-bold text-soft-white/80">{row.original.role.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      accessorKey: "lastActive",
      header: "Last Activity",
      cell: ({ row }) => <span className="text-xs text-soft-white/30">{row.original.lastActive}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          variant={row.original.status === "Active" ? "success" : "default"} 
        />
      ),
    },
    {
      id: "actions",
      cell: () => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-soft-white/40 hover:text-soft-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-dark-surface border-white/10 text-soft-white">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-soft-white/30">Admin Controls</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                <Key className="mr-2 h-4 w-4" /> Reset Credentials
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                <ShieldAlert className="mr-2 h-4 w-4" /> Edit Permissions
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="cursor-pointer text-error focus:bg-error/5 focus:text-error">
                Deactivate Access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <PageHeader 
        title="Internal Access Control" 
        subtitle="Manage administrative accounts, define roles, and audit access permissions."
      >
        <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 px-6 font-bold">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Administrator
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="p-6 rounded-[32px] bg-dark-surface border border-white/5 flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20">
               <Fingerprint className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
               <h4 className="text-sm font-bold text-soft-white">Security Compliance</h4>
               <p className="text-xs text-soft-white/40 mt-1">100% of admins have enabled 2FA (Mandatory policy).</p>
            </div>
         </div>
         <div className="p-6 rounded-[32px] bg-dark-surface border border-white/5 flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20">
               <ShieldCheck className="w-6 h-6 text-accent-orange" />
            </div>
            <div>
               <h4 className="text-sm font-bold text-soft-white">Active Sessions</h4>
               <p className="text-xs text-soft-white/40 mt-1">4 active administrative sessions across 2 locations.</p>
            </div>
         </div>
         <div className="p-6 rounded-[32px] bg-dark-surface border border-white/5 flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center border border-success/20">
               <Key className="w-6 h-6 text-success" />
            </div>
            <div>
               <h4 className="text-sm font-bold text-soft-white">Recent Key Rotation</h4>
               <p className="text-xs text-soft-white/40 mt-1">Last system-wide key rotation was 14 days ago.</p>
            </div>
         </div>
      </div>

      <DataTable 
        columns={columns} 
        data={mockAdmins} 
        searchKey="name"
        placeholder="Search admins..."
      />
    </DashboardShell>
  );
}

import { cn } from "@/app/lib/utils";
