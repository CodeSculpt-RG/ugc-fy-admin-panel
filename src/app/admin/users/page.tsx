"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  User as UserIcon,
  Filter
} from "lucide-react";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { UserKycReviewPanel } from "@/app/components/ui/user-kyc-review-panel";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { cn } from "@/app/lib/utils";
import { useToast } from "@/app/hooks/useToast";
import { userService } from "@/app/services/userService";
import { approvalService } from "@/app/services/approvalService";
import { User } from "@/app/types";
import { normalizeError } from "@/lib/api/normalizeError";

export default function UsersPage() {
  const { hasPermission } = useAdminAuth();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState(false);
  
  const [modalConfig, setModalConfig] = useState({ 
    title: "", 
    description: "", 
    variant: "danger" as "danger" | "info" | "warning" | "success",
    showInput: false,
    confirmText: "Confirm",
    actionType: "" as "block" | "authorize" | "reject"
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMsg(null);
    try {
      const data = await userService.getUsers();
      setLocalUsers(data);
    } catch (err: unknown) {
      const normalizedError = normalizeError(err);
      console.error("[UsersPage] Failed to fetch identity protocols:", normalizedError);
      setIsError(true);
      setErrorMsg(normalizedError.message);
      showToast(normalizedError.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return localUsers.filter(u => {
      const matchRole = selectedRole === "all" || u.role.toLowerCase() === selectedRole.toLowerCase();
      const matchStatus = selectedStatus === "all" || u.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchRole && matchStatus;
    });
  }, [localUsers, selectedRole, selectedStatus]);

  const handleAction = (user: User, action: string) => {
    setSelectedUser(user);
    if (action === "view") {
      setSelectedUserId(user.id);
      setReviewPanelOpen(true);
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
    } else if (action === "reject") {
      setModalConfig({
        title: "Profile Rejection",
        description: `Please provide a detailed reason for rejecting ${user.name}'s profile application.`,
        variant: "warning",
        showInput: true,
        confirmText: "Reject Profile",
        actionType: "reject"
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
    setActionLoading(true);
    try {
      if (modalConfig.actionType === "block") {
        await approvalService.updateApprovalStatus(selectedUser.id, "blocked", reason || "Administrative access restriction");
        showToast(`User identity restricted in global ledger.`, "warning");
      } else if (modalConfig.actionType === "reject") {
        await approvalService.updateApprovalStatus(selectedUser.id, "rejected", reason || "Profile requirements not met");
        showToast(`User identity rejected.`, "warning");
      } else if (modalConfig.actionType === "authorize") {
        await approvalService.updateApprovalStatus(selectedUser.id, "approved", "Manual administrative authorization");
        showToast(`User identity authorized successfully.`, "success");
      }
      setIsConfirmModalOpen(false);
      await loadUsers(); // Refresh the ledger
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Administrative protocol failed: ${msg}`, "error");
    } finally {
      setActionLoading(false);
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
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-primary-blue/10 transition-all duration-500 flex-shrink-0">
            <UserIcon className="w-5 h-5 text-[#F0F0FB]/20 group-hover:text-primary-blue transition-colors" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight truncate">{row.original.name}</p>
            <p className="text-[11px] font-black text-[#F0F0FB]/20 uppercase tracking-widest truncate">{row.original.email}</p>
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
            label: "Review KYC & Dossier",
            icon: Eye,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Operational Directives",
            variant: "blue"
          },
          {
            label: "Authorize Security Identity",
            icon: ShieldCheck,
            onClick: () => handleAction(row.original, "authorize"),
            variant: "blue",
            hidden: !hasPermission("users.approve")
          },
          {
            label: "Reject Profile",
            icon: ShieldAlert,
            onClick: () => handleAction(row.original, "reject"),
            variant: "orange",
            hidden: !hasPermission("users.approve")
          },
          {
            label: "Restrict System Access",
            icon: Ban,
            onClick: () => handleAction(row.original, "block"),
            variant: "orange",
            isSeparator: true,
            hidden: !hasPermission("users.block")
          }
        ];

        return <ActionDropdown actions={userActions} />;
      },
    },
  ];

  return (
    <ProtectedRoute permission="users.read">
      <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Identity Protocols" 
          subtitle="Enterprise-grade management of platform entities and security vectors."
        >
          <button 
            onClick={() => loadUsers()}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-primary-blue text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95 disabled:opacity-50"
          >
            <span>Synchronize Global Ledger</span>
          </button>
        </PageHeader>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-[#0F172A] border border-white/[0.08] mb-10 shadow-sm">
          <div className="flex items-center space-x-3 text-[#F0F0FB]/40 text-xs font-black uppercase tracking-widest">
            <Filter className="w-4 h-4 text-primary-blue" />
            <span>Ledger Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-[#111827] border border-white/[0.08] rounded-2xl px-4 py-2">
              <span className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-widest">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#F0F0FB] focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-[#111827]">All Roles</option>
                <option value="creator" className="bg-[#111827]">Creator</option>
                <option value="brand" className="bg-[#111827]">Brand</option>
                <option value="admin" className="bg-[#111827]">Admin</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-[#111827] border border-white/[0.08] rounded-2xl px-4 py-2">
              <span className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-widest">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#F0F0FB] focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-[#111827]">All Status</option>
                <option value="active" className="bg-[#111827]">Active</option>
                <option value="pending" className="bg-[#111827]">Pending</option>
                <option value="restricted" className="bg-[#111827]">Restricted</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Synchronizing Identity Records..." />
        ) : isError ? (
          <ErrorState message={errorMsg || undefined} onRetry={loadUsers} />
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredUsers} 
            searchKey="email"
            placeholder="Query user infrastructure by email..."
            onRowClick={(row) => {
              setSelectedUserId(row.id);
              setReviewPanelOpen(true);
            }}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant}
        showInput={modalConfig.showInput}
        confirmText={modalConfig.confirmText}
        loading={actionLoading}
      />

      <UserKycReviewPanel
        isOpen={reviewPanelOpen}
        onClose={() => setReviewPanelOpen(false)}
        userId={selectedUserId}
        onUpdate={loadUsers}
      />
      </DashboardShell>
    </ProtectedRoute>
  );
}
