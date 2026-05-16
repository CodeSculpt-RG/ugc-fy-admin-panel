"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  Mail,
  User as UserIcon,
  Smartphone,
  MapPin
} from "lucide-react";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { cn } from "@/app/lib/utils";


import { useToast } from "@/app/hooks/useToast";
import { userService } from "@/app/services/userService";
import { approvalService } from "@/app/services/approvalService";
import { User } from "@/app/types";

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  const [modalConfig, setModalConfig] = useState({ 
    title: "", 
    description: "", 
    variant: "danger" as "danger" | "info" | "warning" | "success",
    showInput: false,
    confirmText: "Confirm",
    actionType: "" as "block" | "authorize"
  });

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await userService.getUsers();
      setLocalUsers(data);
    } catch (err) {
      console.error("[UsersPage] Failed to fetch identity protocols:", err);
      setIsError(true);
      showToast("Infrastructure desync: unable to sync global identity ledger.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    const synchronize = async () => {
      await loadUsers();
    };
    synchronize();
  }, [loadUsers]);

  const handleAction = (user: User, action: string) => {
    setSelectedUser(user);
    if (action === "view") {
      setIsDrawerOpen(true);
    } else if (action === "authorize") {
      setModalConfig({
        title: "Identity Authorization",
      description: `Confirm that ${user.name}'s identity has been reviewed and verified. This will grant them "Approved" status across the platform.`,
        variant: "info",
        showInput: false,
        confirmText: "Authorize Identity",
        actionType: "authorize"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "block") {
      setModalConfig({
        title: "Access Restriction",
      description: `This will restrict ${user.name} from accessing platform features. Please provide a justification for this security protocol.`,
        variant: "danger",
        showInput: true,
        confirmText: "Restrict Access",
        actionType: "block"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedUser) return;

    try {
      if (modalConfig.actionType === "block") {
        await approvalService.updateApprovalStatus(selectedUser.id, "blocked", reason || "Administrative access restriction");
        showToast(`User identity restricted in global ledger.`, "warning");
      } else if (modalConfig.actionType === "authorize") {
        await approvalService.updateApprovalStatus(selectedUser.id, "approved", "Manual administrative authorization");
        showToast(`User identity authorized successfully.`, "success");
      }
      setIsConfirmModalOpen(false);
      loadUsers(); // Refresh the ledger
    } catch {
      showToast("Administrative protocol failed: transaction rejected by the API.", "error");
    }
  };



  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: "Email",
      enableHiding: true,
      cell: () => null,
    },
    {
      accessorKey: "name",
      header: "User Infrastructure",
      cell: ({ row }) => (
        <div className="flex items-center space-x-5 py-2">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-primary-blue/10 transition-all duration-500">
            <UserIcon className="w-5 h-5 text-[#F0F0FB]/20 group-hover:text-primary-blue transition-colors" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight">{row.original.name}</p>
            <p className="text-[11px] font-black text-[#F0F0FB]/20 uppercase tracking-widest">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Classification",
      cell: ({ row }) => <span className="text-[11px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.2em]">{row.original.role}</span>,
    },
    {
      accessorKey: "status",
      header: "Operational State",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          variant={row.original.status === "Active" ? "success" : row.original.status === "Pending" ? "warning" : "error"} 
        />
      ),
    },
    {
      accessorKey: "verification",
      header: "Security Tier",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500",
            row.original.verification === "Verified" 
              ? "bg-primary-blue/10 border-primary-blue/15 text-primary-blue" 
              : "bg-accent-orange/10 border-accent-orange/15 text-accent-orange"
          )}>
            {row.original.verification === "Verified" ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          </div>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            row.original.verification === "Verified" ? "text-primary-blue" : "text-accent-orange"
          )}>{row.original.verification}</span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const userActions: ActionItem[] = [
          {
            label: "Analyze User Infrastructure",
            icon: Eye,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Operational Directives"
          },
          {
            label: "Authorize Security Identity",
            icon: ShieldCheck,
            onClick: () => handleAction(row.original, "authorize"),
            variant: "blue"
          },
          {
            label: "Restrict System Access",
            icon: Ban,
            onClick: () => handleAction(row.original, "block"),
            variant: "orange",
            isSeparator: true
          }
        ];

        return <ActionDropdown actions={userActions} />;
      },
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Identity Protocols" 
          subtitle="Enterprise-grade management of platform entities and security vectors."
        >
          <button 
            onClick={() => loadUsers()}
            className="flex items-center space-x-3 px-6 py-3 rounded-2xl bg-primary-blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
          >
            <span>Synchronize Global Ledger</span>
          </button>
        </PageHeader>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="p-6 rounded-[32px] bg-error/10 border border-error/20 text-error">
               <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-black text-[#F0F0FB]">Ledger Synchronization Failure</p>
              <p className="text-sm text-[#F0F0FB]/40">Unable to establish a secure handshake with the identity infrastructure.</p>
            </div>
            <button 
              onClick={() => loadUsers()}
              className="h-12 px-8 rounded-2xl bg-white/[0.03] border border-white/10 text-[#F0F0FB] text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue hover:border-primary-blue transition-all active:scale-95"
            >
              Retry Handshake
            </button>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={localUsers} 
            isLoading={isLoading}
            searchKey="email"
            placeholder="Query user infrastructure by email or unique identifier..."
          />
        )}
      </div>

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedUser?.name || "Entity Profile"}
        subtitle={`System ID: ${selectedUser?.id || "N/A"} • ${selectedUser?.role || "ENTITY"}`}
      >

        {selectedUser && (
          <div className="space-y-12">
            {/* Aggregate Metrics */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] shadow-sm">
                <p className="stat-label mb-4">Operational Status</p>
                <StatusBadge status={selectedUser.status} variant={selectedUser.status === "Active" ? "success" : "warning"} />
              </div>
              <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] shadow-sm">
                <p className="stat-label mb-4">Risk Evaluation</p>
                <p className={cn(
                  "text-2xl font-black tracking-tighter uppercase",
                  selectedUser.riskLevel === 'High' ? 'text-error' : 'text-primary-blue'
                )}>{selectedUser.riskLevel} IMPACT</p>
              </div>
            </div>


            {/* Infrastructure Credentials */}
            <div className="space-y-8">
              <h4 className="stat-label">Core Infrastructure</h4>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: "Digital Communications", value: selectedUser.email },
                  { icon: Smartphone, label: "Network Endpoint", value: "+91 98765 43210" },
                  { icon: MapPin, label: "Geographic Coordinate", value: "Mumbai, India" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center space-x-6 p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.08] shadow-sm hover:border-primary-blue/20 transition-all cursor-pointer">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-[#F0F0FB]/20">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="stat-label leading-none">{item.label}</p>
                      <p className="text-base font-black text-[#F0F0FB] mt-2 tracking-tight">{item.value}</p>
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* Audit History */}
            <div className="space-y-8">
               <h4 className="stat-label">Temporal Audit Log</h4>
               <div className="space-y-10 border-l-2 border-white/[0.08] ml-6 pl-10 relative">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="relative">
                       <div className="absolute -left-[51px] top-1 w-5 h-5 rounded-full bg-[#030712] border-4 border-primary-blue shadow-lg shadow-primary-blue/20 z-10" />
                       <div>
                          <p className="text-base font-black text-[#F0F0FB] tracking-tighter">System Access Authorized</p>
                          <p className="text-[12px] font-medium text-[#F0F0FB]/30 mt-2 leading-relaxed italic">Verified terminal connection established from endpoint 192.168.1.{i} • {i}h ago</p>
                       </div>
                    </div>
                  ))}
               </div>

            </div>

            {/* Security Directives */}
            <div className="pt-12 border-t border-white/[0.08] space-y-8">
               <h4 className="text-[10px] font-black text-error/40 uppercase tracking-[0.4em]">Administrative Directives</h4>
               <div className="grid grid-cols-1 gap-4">
                  <button className="w-full h-16 rounded-[28px] bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95">
                    Re-initialize Security Credentials
                  </button>
                  <button className="w-full h-16 rounded-[28px] bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-error hover:text-white hover:border-error transition-all active:scale-95 shadow-sm">
                    Deactivate System Access
                  </button>
               </div>
            </div>

          </div>
        )}
      </DetailDrawer>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant}

        showInput={modalConfig.showInput}
        confirmText={modalConfig.confirmText}
      />
    </DashboardShell>
  );
}
