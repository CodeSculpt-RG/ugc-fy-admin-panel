"use client";

import React, { useState, useCallback, useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import { 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  User as UserIcon,
  Fingerprint,
  XCircle,
  RefreshCw
} from "lucide-react";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { AdminUser } from "@/app/types";
import { cn } from "@/app/lib/utils";
import { adminManagementService } from "@/app/services/adminManagementService";
import { useToast } from "@/app/hooks/useToast";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { AddAdminModal } from "@/app/components/modals/AddAdminModal";

export default function AdminManagementPage() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await adminManagementService.getAdmins();
      const searchableData = data.map(adm => ({
        ...adm,
        searchable: `${adm.email} ${adm.platformId || ''} ${adm.name}`.toLowerCase()
      }));
      setAdmins(searchableData);
    } catch (error) {
      console.error("[AdminManagementPage] Failed to fetch admins:", error);
      setIsError(true);
      showToast("Infrastructure synchronization failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadAdmins();
  }, [loadAdmins]);

  const handleAction = (admin: AdminUser, action: string) => {
    if (action === "reset") {
      showToast(`Security credentials reset protocol initiated for ${admin.name}`, "info");
    } else if (action === "edit") {
      showToast(`Permission vectors updated for ${admin.name}`, "success");
    } else if (action === "terminate") {
      showToast(`Administrative access terminated for ${admin.name}`, "error");
      setAdmins(prev => prev.filter(a => a.id !== admin.id));
    }
  };

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "name",
      header: "Administrator Profile",
      cell: ({ row }) => (
        <div className="flex items-center space-x-4 py-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center shadow-sm flex-shrink-0">
            <UserIcon className="w-5 h-5 text-foreground/20" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black text-foreground tracking-tight leading-none truncate">{row.original.name}</p>
            <p className="text-[10px] text-foreground/20 uppercase font-black tracking-widest mt-2 truncate">ID_REF: {row.original.id.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "platformId",
      header: "Platform ID",
      cell: ({ row }) => (
        <span className="text-[11px] font-black text-foreground/60 uppercase tracking-widest">
          {row.original.platformId || "PENDING"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Network Identifier",
      cell: ({ row }) => <span className="text-[11px] font-black text-foreground/40 uppercase tracking-widest truncate">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Access Vector",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3 whitespace-nowrap">
          <ShieldCheck className={cn(
            "w-4 h-4 flex-shrink-0",
            row.original.role === "SUPER_ADMIN" ? "text-primary" : "text-foreground/10"
          )} />
          <span className="text-[11px] font-black text-foreground uppercase tracking-[0.2em]">{row.original.role.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      accessorKey: "lastActive",
      header: "Temporal Presence",
      cell: ({ row }) => <span className="text-[11px] font-black text-foreground/20 tracking-tighter uppercase whitespace-nowrap">{row.original.lastActive}</span>,
    },
    {
      accessorKey: "status",
      header: "Operational State",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          variant={row.original.status === "Active" ? "success" : "default"} 
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const adminActions: ActionItem[] = [
          {
            label: "Reset Security Credentials",
            icon: Key,
            onClick: () => handleAction(row.original, "reset"),
            sectionLabel: "Security Protocols"
          },
          {
            label: "Edit Permission Vectors",
            icon: ShieldAlert,
            onClick: () => handleAction(row.original, "edit")
          },
          {
            label: "Terminate Access",
            icon: XCircle,
            onClick: () => handleAction(row.original, "terminate"),
            variant: "orange" as const,
            isSeparator: true
          }
        ];

        return <ActionDropdown actions={adminActions} />;
      },
    },
  ];

  const activeCount = admins.filter(a => a.status === "Active").length;

  return (
    <ProtectedRoute permission="admin_management.read">
      <DashboardShell>
        <div className="section-spacing">
          <PageHeader 
            title="Administrative Infrastructure" 
            subtitle="Enterprise management of internal access vectors, role definitions, and operational security protocols."
          >
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => loadAdmins()}
                disabled={isLoading}
                className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-surface-elevated border border-border text-white text-[11px] font-black uppercase tracking-widest hover:bg-surface-elevated transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sync Nodes</span>
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-3 h-12 px-8 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision Admin</span>
              </button>
            </div>
          </PageHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
             <div className="p-8 rounded-[32px] bg-surface border border-border flex items-start space-x-5 shadow-premium group hover:border-primary/20 transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/15 shadow-sm shadow-primary/5 shrink-0">
                   <Fingerprint className="w-7 h-7 text-primary" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-2">Protocol Compliance</h4>
                   <p className="text-sm font-black text-foreground tracking-tight leading-none">Security Enforcement</p>
                   <p className="text-[12px] font-medium text-foreground/40 mt-3 leading-relaxed">100% of nodes have 2FA enabled (Mandatory platform directive).</p>
                </div>
             </div>

             <div className="p-8 rounded-[32px] bg-surface border border-border flex items-start space-x-5 shadow-premium group hover:border-accent-orange/20 transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-orange/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-[20px] bg-accent-orange/10 flex items-center justify-center border border-accent-orange/15 shadow-sm shadow-accent-orange/5 shrink-0">
                   <ShieldCheck className="w-7 h-7 text-accent-orange" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-2">Operational Presence</h4>
                   <p className="text-sm font-black text-foreground tracking-tight leading-none">Active Nodes</p>
                   <p className="text-[12px] font-medium text-foreground/40 mt-3 leading-relaxed">{activeCount} active administrative sessions across platform clusters.</p>
                </div>
             </div>

             <div className="p-8 rounded-[32px] bg-surface border border-border flex items-start space-x-5 shadow-premium group hover:border-success-green/20 transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-success-green/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-[20px] bg-success-green/10 flex items-center justify-center border border-success-green/15 shadow-sm shadow-success-green/5 shrink-0">
                   <Key className="w-7 h-7 text-success-green" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-2">Credential Lifecycle</h4>
                   <p className="text-sm font-black text-foreground tracking-tight leading-none">Rotation Protocol</p>
                   <p className="text-[12px] font-medium text-foreground/40 mt-3 leading-relaxed">Last system-wide credential rotation was 14 days ago.</p>
                </div>
             </div>
          </div>

          {isLoading ? (
            <LoadingState message="Synchronizing Network Administrators..." />
          ) : isError ? (
            <ErrorState onRetry={loadAdmins} />
          ) : (
            <DataTable 
              columns={columns} 
              data={admins} 
              searchKey="searchable"
              placeholder="Query administrative network by name, email, or platform ID..."
            />
          )}

          <AddAdminModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={loadAdmins}
          />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
