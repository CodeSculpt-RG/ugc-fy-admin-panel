"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Eye, 
  CheckCircle2, 
  User as UserIcon,
  Star,
  TrendingUp,
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

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  const { session, loading: authLoading } = useAdminAuth();
  
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

  const loadCreators = useCallback(async (statusOverride?: string) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMsg(null);
    try {
      const data = await creatorService.getCreators(statusOverride);
      setCreators(data);
    } catch (error: unknown) {
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

    loadCreators(selectedStatus);
  }, [authLoading, session, selectedStatus, loadCreators]);

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
      const statusMap: Record<string, "approved" | "rejected" | "blocked" | "pending_review"> = {
        approve: "approved",
        reject: "rejected",
        block: "blocked",
        "": "pending_review"
      };

      await approvalService.updateApprovalStatus(
        selectedCreator.id, 
        statusMap[modalConfig.actionType] || "pending_review",
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
      accessorKey: "email",
      header: "Email",
      enableHiding: true,
      cell: () => null,
    },
    {
      accessorKey: "name",
      header: "Creator Entity",
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
      accessorKey: "niche",
      header: "Strategic Niche",
      cell: ({ row }) => <span className="text-[11px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.25em]">{row.original.niche}</span>,
    },
    {
      accessorKey: "followers",
      header: "Audience Density",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 text-[11px] font-black text-[#F0F0FB]/60 tracking-tighter">
          <TrendingUp className="w-3.5 h-3.5 text-success-green" />
          <span>{row.original.followers}</span>
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Trust Score",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Star className="w-3.5 h-3.5 text-accent-orange fill-accent-orange shadow-sm" />
          <span className="text-[11px] font-black text-[#F0F0FB]">{row.original.rating}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Operational State",
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
            className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-primary-blue text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Synchronize Network</span>
          </button>
        </PageHeader>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-[#0F172A] border border-white/[0.08] mb-10 shadow-sm">
          <div className="flex items-center space-x-3 text-[#F0F0FB]/40 text-xs font-black uppercase tracking-widest">
            <Filter className="w-4 h-4 text-primary-blue" />
            <span>Creator Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-[#111827] border border-white/[0.08] rounded-2xl px-4 py-2">
              <span className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-widest">Niche:</span>
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#F0F0FB] focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-[#111827]">All Niches</option>
                {uniqueNiches.map(niche => (
                  <option key={niche} value={niche} className="bg-[#111827]">{niche}</option>
                ))}
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
                <option value="approved" className="bg-[#111827]">Approved</option>
                <option value="pending_review" className="bg-[#111827]">Pending Review</option>
                <option value="rejected" className="bg-[#111827]">Rejected</option>
                <option value="blocked" className="bg-[#111827]">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Synchronizing Creator Network..." />
        ) : isError ? (
          <ErrorState message={errorMsg || undefined} onRetry={() => loadCreators(selectedStatus)} />
        ) : filteredCreators.length === 0 ? (
          <div className="p-20 text-center text-xs font-black uppercase tracking-[0.3em] text-[#F0F0FB]/30 bg-[#0F172A] border border-white/[0.08] rounded-[40px] shadow-sm">
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
