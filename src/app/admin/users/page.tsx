"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { ColumnDef } from "@tanstack/react-table";
import { 
  MoreVertical, 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  History,
  Mail,
  User as UserIcon,
  Smartphone,
  MapPin
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
import { cn } from "@/app/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Creator" | "Brand";
  status: "Active" | "Pending" | "Suspended" | "Blocked";
  verification: "Verified" | "Unverified";
  lastActive: string;
  riskLevel: "Low" | "Medium" | "High";
}

const mockUsers: User[] = [
  { id: "1", name: "Alex Rivera", email: "alex@rivera.com", role: "Creator", status: "Active", verification: "Verified", lastActive: "2m ago", riskLevel: "Low" },
  { id: "2", name: "Sarah Chen", email: "sarah@chen.co", role: "Creator", status: "Pending", verification: "Unverified", lastActive: "1d ago", riskLevel: "Medium" },
  { id: "3", name: "Nike Global", email: "admin@nike.com", role: "Brand", status: "Active", verification: "Verified", lastActive: "12m ago", riskLevel: "Low" },
  { id: "4", name: "Marcus Thorne", email: "marcus@fitness.com", role: "Creator", status: "Suspended", verification: "Verified", lastActive: "5d ago", riskLevel: "High" },
  { id: "5", name: "Glow Beauty", email: "hello@glow.com", role: "Brand", status: "Active", verification: "Verified", lastActive: "1h ago", riskLevel: "Low" },
];

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: "", description: "", variant: "danger" as any });

  const handleAction = (user: User, action: string) => {
    if (action === "view") {
      setSelectedUser(user);
      setIsDrawerOpen(true);
    } else if (action === "block") {
      setModalConfig({
        title: "Block User",
        description: `Are you sure you want to block ${user.name}? This will revoke all access to the platform immediately.`,
        variant: "danger"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20">
            <UserIcon className="w-5 h-5 text-primary-blue" />
          </div>
          <div>
            <p className="text-sm font-bold text-soft-white">{row.original.name}</p>
            <p className="text-xs text-soft-white/30">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <span className="text-xs font-medium text-soft-white/60">{row.original.role}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          variant={row.original.status === "Active" ? "success" : row.original.status === "Pending" ? "warning" : "error"} 
        />
      ),
    },
    {
      accessorKey: "verification",
      header: "Verification",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5 text-xs font-bold text-soft-white/40">
          {row.original.verification === "Verified" ? (
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-warning" />
          )}
          <span>{row.original.verification}</span>
        </div>
      ),
    },
    {
      accessorKey: "riskLevel",
      header: "Risk",
      cell: ({ row }) => (
        <span className={cn(
          "text-[10px] font-black uppercase",
          row.original.riskLevel === "High" ? "text-error" : 
          row.original.riskLevel === "Medium" ? "text-warning" : "text-success"
        )}>
          {row.original.riskLevel}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-soft-white/40 hover:text-soft-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-dark-surface border-white/10 text-soft-white">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-soft-white/30">Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleAction(row.original, "view")} className="cursor-pointer focus:bg-white/5">
                <Eye className="mr-2 h-4 w-4" /> View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                <ShieldCheck className="mr-2 h-4 w-4" /> Verify User
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={() => handleAction(row.original, "block")} className="cursor-pointer text-error focus:bg-error/5 focus:text-error">
                <Ban className="mr-2 h-4 w-4" /> Block User
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
        title="User Management" 
        subtitle="Manage all platform users, their roles, and security statuses."
      >
        <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl">
          Export Users
        </Button>
      </PageHeader>

      <DataTable 
        columns={columns} 
        data={mockUsers} 
        searchKey="name"
        placeholder="Search by name or email..."
      />

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedUser?.name || "User Details"}
        subtitle={selectedUser?.role}
      >
        {selectedUser && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-soft-white/30 font-bold mb-1">Status</p>
                <StatusBadge status={selectedUser.status} variant="success" />
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-soft-white/30 font-bold mb-1">Risk Score</p>
                <p className="text-sm font-bold text-soft-white">{selectedUser.riskLevel}</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Account Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-primary-blue" />
                  <span className="text-soft-white">{selectedUser.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Smartphone className="w-4 h-4 text-primary-blue" />
                  <span className="text-soft-white">+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary-blue" />
                  <span className="text-soft-white">Mumbai, India</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Recent Activity</h4>
               <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-3">
                       <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary-blue" />
                       <div>
                          <p className="text-xs font-bold text-soft-white">Logged in from new device</p>
                          <p className="text-[10px] text-soft-white/30 mt-0.5">iPhone 15 Pro • 192.168.1.1 • 2h ago</p>
                       </div>
                    </div>
                  ))}
               </div>
               <Button variant="ghost" className="w-full text-xs font-bold text-primary-blue hover:bg-primary-blue/10">
                  <History className="w-3.5 h-3.5 mr-2" />
                  View Full Audit Log
               </Button>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 border-t border-white/5 space-y-4">
               <h4 className="text-xs font-bold text-error/40 uppercase tracking-[0.2em]">Administrative Actions</h4>
               <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start border-white/10 hover:bg-white/5 text-soft-white font-bold">
                    Reset User Password
                  </Button>
                  <Button variant="outline" className="justify-start border-white/10 hover:bg-white/5 text-soft-white font-bold">
                    Flag for Review
                  </Button>
                  <Button className="justify-start bg-error hover:bg-error/90 text-white font-bold">
                    Suspend Account
                  </Button>
               </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => setIsConfirmModalOpen(false)}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant}
      />
    </DashboardShell>
  );
}
