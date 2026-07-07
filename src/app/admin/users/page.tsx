"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { DataTable } from "@/app/components/ui/data-table";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  Filter,
  Info
} from "lucide-react";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { UserKycReviewPanel } from "@/app/components/ui/user-kyc-review-panel";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { useAdminAuth } from "@/app/context/AdminAuthContext";

import { useToast } from "@/app/hooks/useToast";
import { formatDateStable } from "@/lib/utils/formatDate";
import { userService } from "@/app/services/userService";
import { approvalService } from "@/app/services/approvalService";
import { User } from "@/app/types";

const COPY = {
  syncData: "Sync Data",
  filters: "Filters:",
  role: "Role:",
  allRoles: "All Roles",
  creator: "Creator",
  brand: "Brand",
  status: "Status:",
  allStatus: "All Status",
  active: "Active",
  pending: "Pending",
  restricted: "Restricted",
} as const;

export default function UsersPage() {
  const { hasPermission } = useAdminAuth();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPartialData, setIsPartialData] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState(false);
  
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    variant: "danger" | "info" | "warning" | "success";
    showInput: boolean;
    confirmText: string;
    actionType: "block" | "authorize" | "reject" | "hold" | "delete" | null;
  }>({ 
    title: "", 
    description: "", 
    variant: "danger",
    showInput: false,
    confirmText: "Confirm",
    actionType: null
  });

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMsg(null);
    try {
      const data = await userService.getUsers(signal);
      setLocalUsers(data);
      setIsPartialData(Boolean(userService.getLastUsersMeta()?.partial));
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[UsersPage] Data load error:", err instanceof Error ? err.message : String(err));
      setIsError(true);
      const friendlyMsg = "Unable to load user operations. Some profile fields may not be available yet.";
      setErrorMsg(friendlyMsg);
      showToast(friendlyMsg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadUsers(controller.signal);
      }
    });
    return () => controller.abort(new DOMException("Users request cancelled", "AbortError"));
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return localUsers.filter(u => {
      if (u.role.toLowerCase() === 'admin') return false;
      const matchRole = selectedRole === "all" || u.role.toLowerCase() === selectedRole.toLowerCase();
      const matchStatus = selectedStatus === "all" || u.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchRole && matchStatus;
    }).map(u => ({
      ...u,
      searchable: `${u.email} ${u.platformId || ''} ${u.name} ${u.role || ''} ${u.phone || ''}`.toLowerCase()
    }));
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
    } else if (action === "hold") {
      setModalConfig({
        title: "Put User On Hold",
        description: `This will place ${user.name} on administrative hold. They will not be visible publicly. Provide a reason.`,
        variant: "warning",
        showInput: true,
        confirmText: "Put on Hold",
        actionType: "hold"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "delete") {
      setModalConfig({
        title: "Permanently Delete Account",
        description: `WARNING: This will soft-delete ${user.name}'s account and restrict access. This action preserves all audit logs in the system ledger.`,
        variant: "danger",
        showInput: true,
        confirmText: "Delete Account",
        actionType: "delete"
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
      } else if (modalConfig.actionType === "hold") {
        await approvalService.updateApprovalStatus(selectedUser.id, "on_hold", reason || "Administrative hold applied");
        showToast(`User identity placed on hold.`, "warning");
      } else if (modalConfig.actionType === "delete") {
        await approvalService.updateApprovalStatus(selectedUser.id, "deleted", reason || "Administrative soft delete");
        showToast(`User account soft-deleted. Audit logs preserved.`, "success");
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

  type SearchableUser = User & { searchable?: string };

  const columns: ColumnDef<SearchableUser>[] = [
    {
      accessorKey: "searchable",
      header: "",
      enableHiding: true,
      cell: () => null,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="text-[14px] font-bold text-[#111827] dark:text-white">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-[14px] text-[#4B5563] dark:text-white">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "platformId",
      header: "Platform ID",
      cell: ({ row }) => (
        <span className="text-[14px] font-mono text-[#4B5563] dark:text-white">{row.original.platformId || "CN000000"}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="text-[14px] text-[#4B5563] dark:text-white capitalize">{row.original.role}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusPill 
          label={row.original.status === "approved" ? "APPROVED" : row.original.status === "pending_review" || row.original.status === "pending" ? "PENDING" : row.original.status === "on_hold" ? "ON HOLD" : row.original.status === "rejected" ? "REJECTED" : "RESTRICTED"} 
          variant={row.original.status === "approved" ? "success" : (row.original.status === "pending" || row.original.status === "pending_review" || row.original.status === "on_hold") ? "warning" : "error"} 
        />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const dateStr = row.original.createdAt || row.original.created_at || row.original.lastActive;
        return (
          <span className="text-[14px] text-[#4B5563] dark:text-white">
            {dateStr ? formatDateStable(dateStr) : "—"}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
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
            label: "Put User On Hold",
            icon: ShieldAlert,
            onClick: () => handleAction(row.original, "hold"),
            variant: "orange",
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
            hidden: !hasPermission("users.block")
          },
          {
            label: "Permanently Delete Account",
            icon: Ban,
            onClick: () => handleAction(row.original, "delete"),
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
      <div className="space-y-5">
        <CommandHeader 
          title="Identity Protocols" 
          description="Enterprise-grade management of platform entities and security vectors."
        >
          <button 
            onClick={() => void loadUsers()}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <span>{COPY.syncData}</span>
          </button>
        </CommandHeader>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-[28px] ugcfy-glass">
          <div className="flex items-center space-x-3 text-text-secondary text-sm font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            <span>{COPY.filters}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
              <span className="text-xs text-text-secondary">{COPY.role}</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-surface">{COPY.allRoles}</option>
                <option value="creator" className="bg-surface">{COPY.creator}</option>
                <option value="brand" className="bg-surface">{COPY.brand}</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
              <span className="text-xs text-text-secondary">{COPY.status}</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-surface">{COPY.allStatus}</option>
                <option value="active" className="bg-surface">{COPY.active}</option>
                <option value="pending" className="bg-surface">{COPY.pending}</option>
                <option value="restricted" className="bg-surface">{COPY.restricted}</option>
              </select>
            </div>
          </div>
        </div>

        {isPartialData && (
          <div className="flex items-start gap-3 rounded-[24px] border border-amber-500/15 bg-amber-50/75 p-4 text-amber-900 shadow-sm backdrop-blur-xl">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold">Some profile details are not available yet.</p>
              <p className="mt-1 text-sm leading-6 text-amber-800/80">
                Core admin data remains accessible while optional creator and brand profile tables are configured.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingState message="Synchronizing Identity Records..." />
        ) : isError ? (
          <ErrorState message={errorMsg || undefined} onRetry={loadUsers} />
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredUsers} 
            searchKey="searchable"
            searchPlaceholder="Query user by email, name, or platform ID (e.g. CN000001)..."
            onRowClick={(row: SearchableUser) => {
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
        confirmTextToType={modalConfig.actionType === "delete" ? "DELETE" : undefined}
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
