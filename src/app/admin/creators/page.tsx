"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Eye, 
  CheckCircle2, 
  Ban,
  Filter,
  Zap
} from "lucide-react";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { UserKycReviewPanel } from "@/app/components/ui/user-kyc-review-panel";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import { Creator } from "@/app/types";
import { creatorService } from "@/app/services/creatorService";
import { approvalService } from "@/app/services/approvalService";
import { useToast } from "@/app/hooks/useToast";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

function resolveApprovalStatus(actionType: string): "approved" | "rejected" | "blocked" | "pending_review" {
  switch (actionType) {
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "block":
      return "blocked";
    default:
      return "pending_review";
  }
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  const { session, loading: authLoading } = useAdminAuth();
  
  // Hardcoded English fallbacks since next-intl is uninstalled
  const t = (key: string) => {
    const translations: Record<string, string> = {
      syncData: "Sync Data",
      filters: "Filters",
      niche: "Niche",
      allNiches: "All Niches",
      status: "Status",
      allStatus: "All Statuses",
      approved: "Approved",
      pendingReview: "Pending Review",
      rejected: "Rejected",
      blocked: "Blocked"
    };
    return translations[key] || key;
  };
  
  const [selectedNiche, setSelectedNiche] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("approved");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    variant: "info" | "danger" | "warning" | "success";
    showInput: boolean;
    confirmText: string;
    actionType: "approve" | "reject" | "block" | "";
  }>({ 
    title: "", 
    description: "", 
    variant: "danger",
    showInput: false,
    confirmText: "Confirm",
    actionType: ""
  });

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;

    if (typeof error === "object" && error !== null) {
      const record = error as Record<string, unknown>;

      if (typeof record.message === "string") return record.message;
      if (typeof record.error === "string") return record.error;
      if (typeof record.details === "string") return record.details;

      try {
        const serialized = JSON.stringify(error);
        return serialized && serialized !== "{}"
          ? serialized
          : "Failed to load creators because an unknown error object was received.";
      } catch {
        return "Failed to load creators because the error could not be serialized.";
      }
    }

    return String(error || "Failed to load creators.");
  }

  const loadCreators = useCallback(async (statusOverride?: string, signal?: AbortSignal) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMsg(null);
    try {
      const data = await creatorService.getCreators(statusOverride, signal);
      setCreators(data);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message = getErrorMessage(error);
      setErrorMsg(message);

      console.error("[CreatorsPage] Failed to load creators:", {
        message,
      });
      setIsError(true);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      setIsError(true);
      setErrorMsg("Admin session missing. Please login again.");
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadCreators(selectedStatus, controller.signal);
      }
    });
    return () => {
      if (!controller.signal.aborted) {
        controller.abort(new DOMException("Creator request cancelled", "AbortError"));
      }
    };
  }, [authLoading, session, selectedStatus, loadCreators]);

  // Listen to realtime KYC submissions to refresh the queue
  useSupabaseRealtime('kyc_submissions', '*', (payload) => {
    // Check if we are viewing pending review or if we just want to update the table
    // For now, we refresh the creators list to show the new KYC status
    if (session) {
      console.log('[Realtime] KYC submission updated:', payload);
      void loadCreators(selectedStatus);
    }
  });

  const uniqueNiches = useMemo(() => {
    const niches = new Set<string>();
    creators.forEach(c => c.niche && niches.add(c.niche));
    return Array.from(niches);
  }, [creators]);

  const filteredCreators = useMemo(() => {
    return creators.filter(c => {
      const matchNiche = selectedNiche === "all" || c.niche.toLowerCase() === selectedNiche.toLowerCase();
      const matchStatus = selectedStatus === "all" || (c.approvalStatus || c.status).toLowerCase() === selectedStatus.toLowerCase();
      return matchNiche && matchStatus;
    });
  }, [creators, selectedNiche, selectedStatus]);

  const handleAction = (creator: Creator, action: string) => {
    setSelectedCreator(creator);
    if (action === "view") {
      setSelectedUserId(creator.id);
      setReviewPanelOpen(true);
    } else if (action === "approve") {
      setModalConfig({
        title: "Approve Creator",
        description: `Are you sure you want to approve ${creator.name}? This will grant them full access to the ecosystem.`,
        variant: "info",
        showInput: false,
        confirmText: "Approve Access",
        actionType: "approve"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "reject") {
      setModalConfig({
        title: "Reject Creator",
        description: `Please provide a detailed reason for rejecting ${creator.name}'s creator application.`,
        variant: "danger",
        showInput: true,
        confirmText: "Reject Application",
        actionType: "reject"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "block") {
      setModalConfig({
        title: "Access Restriction",
        description: `This will restrict ${creator.name} from participating in new campaigns. Please provide a justification for this security protocol.`,
        variant: "danger",
        showInput: true,
        confirmText: "Restrict Access",
        actionType: "block"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedCreator) return;
    setActionLoading(true);
    try {
      const newStatus = resolveApprovalStatus(modalConfig.actionType);

      await approvalService.updateApprovalStatus(
        selectedCreator.id, 
        newStatus,
        reason
      );

      showToast(`Protocol ${modalConfig.actionType} executed successfully`, "success");
      setIsConfirmModalOpen(false);
      await loadCreators(selectedStatus);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error("[CreatorsPage] Action failed:", { message });
      showToast(`Administrative protocol failed: ${message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<Creator>[] = [
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
      accessorKey: "niche",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-[14px] text-[#4B5563] dark:text-white">{row.original.niche}</span>
      ),
    },
    {
      accessorKey: "followers",
      header: "Followers",
      cell: ({ row }) => (
        <span className="text-[14px] text-[#111827] dark:text-white">{row.original.followers}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Approval",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.approvalStatus === 'pending_review' ? 'Pending' : row.original.status} 
          variant={
            row.original.approvalStatus === 'approved' ? "success" : 
            row.original.approvalStatus === 'pending_review' ? "warning" : 
            "error"
          } 
        />
      ),
    },
    {
      accessorKey: "kycStatus",
      header: "KYC",
      cell: ({ row }) => {
        const kyc = row.original.kycStatus || row.original.kyc_status || "not_started";
        const kycLabels: Record<string, string> = {
          not_started: "Not Started",
          submitted: "Submitted",
          pending: "Pending",
          approved: "Approved",
          rejected: "Rejected"
        };
        const kycVariants: Record<string, "success" | "warning" | "error" | "info"> = {
          approved: "success",
          submitted: "warning",
          pending: "warning",
          rejected: "error",
          not_started: "info"
        };
        return (
          <StatusBadge 
            status={kycLabels[kyc] || kyc} 
            variant={kycVariants[kyc] || "info"} 
          />
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const creatorActions: ActionItem[] = [
          {
            label: "Review KYC & Dossier",
            icon: Eye,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Operational Directives",
            variant: "blue"
          },
          ...(row.original.approvalStatus === 'pending_review' ? [
            {
              label: "Approve Creator",
              icon: CheckCircle2,
              onClick: () => handleAction(row.original, "approve"),
              variant: "blue" as const
            },
            {
              label: "Reject Application",
              icon: Ban,
              onClick: () => handleAction(row.original, "reject"),
              variant: "orange" as const
            }
          ] : []),
          {
            label: "Restrict Ecosystem Access",
            icon: Ban,
            onClick: () => handleAction(row.original, "block"),
            variant: "orange",
            isSeparator: true
          }
        ];

        return <ActionDropdown actions={creatorActions} />;
      },
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Creator Infrastructure" 
          subtitle="Enterprise management of creator profiles and identity verification protocols."
        >
          <button 
            onClick={() => loadCreators(selectedStatus)}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{t("syncData")}</span>
          </button>
        </PageHeader>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-card-bg border border-border mb-10 shadow-sm">
          <div className="flex items-center space-x-3 text-text-secondary text-sm font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            <span>{t("filters")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
              <span className="text-xs text-text-secondary">{t("niche")}</span>
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-surface">{t("allNiches")}</option>
                {uniqueNiches.map(niche => (
                  <option key={niche} value={niche} className="bg-surface">{niche}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
              <span className="text-xs text-text-secondary">{t("status")}</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-surface">{t("allStatus")}</option>
                <option value="approved" className="bg-surface">{t("approved")}</option>
                <option value="pending_review" className="bg-surface">{t("pendingReview")}</option>
                <option value="rejected" className="bg-surface">{t("rejected")}</option>
                <option value="blocked" className="bg-surface">{t("blocked")}</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Synchronizing Creator Network..." />
        ) : isError ? (
          <ErrorState message={errorMsg || undefined} onRetry={() => loadCreators(selectedStatus)} />
        ) : filteredCreators.length === 0 ? (
          <div className="p-20 text-center text-xs font-black uppercase tracking-[0.3em] text-foreground/30 bg-card-bg border border-border rounded-[40px] shadow-sm">
            {selectedStatus === "approved" ? "No approved creators found" : "No creators found"}
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredCreators} 
            searchKey="email"
            placeholder="Query creator infrastructure by identifier or email..."
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
        onUpdate={() => loadCreators(selectedStatus)}
      />
    </DashboardShell>
  );
}
