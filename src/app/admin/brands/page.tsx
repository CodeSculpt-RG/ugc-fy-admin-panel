"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Eye, 
  Building2, 
  CheckCircle2, 
  Briefcase,
  Filter,
  Ban,
  Zap
} from "lucide-react";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { UserKycReviewPanel } from "@/app/components/ui/user-kyc-review-panel";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import { Brand } from "@/app/types";
import { brandService } from "@/app/services/brandService";
import { approvalService } from "@/app/services/approvalService";
import { normalizeError } from "@/lib/api/normalizeError";
import { useToast } from "@/app/hooks/useToast";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("approved");
  const [actionLoading, setActionLoading] = useState(false);

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

  const loadBrands = useCallback(async (statusOverride?: string) => {
    const statusToFetch = statusOverride ?? selectedStatus;
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await brandService.getBrands(statusToFetch);
      setBrands(data);
    } catch (err) {
      console.error("[BrandsPage] Failed to load brands:", normalizeError(err));
      setIsError(true);
      showToast("Corporate infrastructure synchronization failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast, selectedStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBrands(selectedStatus);
  }, [selectedStatus, loadBrands]);

  const uniqueIndustries = useMemo(() => {
    const ind = new Set<string>();
    brands.forEach(b => b.industry && ind.add(b.industry));
    return Array.from(ind);
  }, [brands]);

  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const matchIndustry = selectedIndustry === "all" || b.industry.toLowerCase() === selectedIndustry.toLowerCase();
      const matchStatus = selectedStatus === "all" || (b.approvalStatus || b.status).toLowerCase() === selectedStatus.toLowerCase();
      return matchIndustry && matchStatus;
    });
  }, [brands, selectedIndustry, selectedStatus]);

  const handleAction = (brand: Brand, action: string) => {
    setSelectedBrand(brand);
    if (action === "view") {
      setSelectedUserId(brand.id);
      setReviewPanelOpen(true);
    } else if (action === "approve") {
      setModalConfig({
        title: "Approve Brand",
        description: `Are you sure you want to approve ${brand.name}? This will grant them authorization to launch campaigns on the platform.`,
        variant: "info",
        showInput: false,
        confirmText: "Approve Authorization",
        actionType: "approve"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "reject") {
      setModalConfig({
        title: "Reject Brand Verification",
        description: `Please provide a detailed reason for rejecting ${brand.name}'s business verification application.`,
        variant: "danger",
        showInput: true,
        confirmText: "Reject Verification",
        actionType: "reject"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "block") {
      setModalConfig({
        title: "Access Restriction",
        description: `This will prevent ${brand.name} from launching new campaigns. Please provide a justification for this security protocol.`,
        variant: "danger",
        showInput: true,
        confirmText: "Restrict Access",
        actionType: "block"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedBrand) return;
    setActionLoading(true);
    try {
      const statusMap: Record<string, "approved" | "rejected" | "blocked" | "pending_review"> = {
        approve: "approved",
        reject: "rejected",
        block: "blocked",
        "": "pending_review"
      };

      await approvalService.updateApprovalStatus(
        selectedBrand.id, 
        statusMap[modalConfig.actionType] || "pending_review",
        reason
      );

      showToast(`Corporate directive ${modalConfig.actionType} executed successfully`, "success");
      setIsConfirmModalOpen(false);
      await loadBrands(selectedStatus);
    } catch (err) {
      console.error("[BrandsPage] Administrative action failed:", normalizeError(err));
      showToast("Corporate directive failed to execute.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="text-[14px] font-bold text-[#111827]">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-[14px] text-[#4B5563]">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "company",
      header: "Corporate Entity",
      cell: ({ row }) => (
        <span className="text-[14px] text-[#4B5563]">{row.original.company}</span>
      ),
    },
    {
      accessorKey: "activeCampaigns",
      header: "Active Initiatives",
      cell: ({ row }) => (
        <span className="text-[14px] text-[#111827]">{row.original.activeCampaigns} Active</span>
      ),
    },
    {
      accessorKey: "totalSpend",
      header: "Aggregate GMV",
      cell: ({ row }) => (
        <span className="text-[14px] font-bold text-[#111827]">{row.original.totalSpend}</span>
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
        const brandActions: ActionItem[] = [
          {
            label: "Review KYC & Dossier",
            icon: Eye,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Intelligence Vectors",
            variant: "blue"
          },
          ...(row.original.approvalStatus === 'pending_review' ? [
            {
              label: "Approve Brand",
              icon: CheckCircle2,
              onClick: () => handleAction(row.original, "approve"),
              variant: "blue" as const
            },
            {
              label: "Reject Verification",
              icon: Ban,
              onClick: () => handleAction(row.original, "reject"),
              variant: "orange" as const
            }
          ] : []),
          {
            label: "Restrict System Access",
            icon: Ban,
            onClick: () => handleAction(row.original, "block"),
            variant: "orange",
            isSeparator: true
          }
        ];

        return <ActionDropdown actions={brandActions} />;
      },
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Brand Infrastructure" 
          subtitle="Manage corporate identities, review campaign fiscal vectors, and track brand interaction density."
        >
          <button 
            onClick={() => loadBrands(selectedStatus)}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Sync Data</span>
          </button>
        </PageHeader>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-card-bg border border-border mb-10 shadow-sm">
          <div className="flex items-center space-x-3 text-text-secondary text-sm font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
              <span className="text-xs text-text-secondary">Industry:</span>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-surface">All Industries</option>
                {uniqueIndustries.map(ind => (
                  <option key={ind} value={ind} className="bg-surface">{ind}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
              <span className="text-xs text-text-secondary">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-surface">All Status</option>
                <option value="approved" className="bg-surface">Approved</option>
                <option value="pending_review" className="bg-surface">Pending Review</option>
                <option value="rejected" className="bg-surface">Rejected</option>
                <option value="blocked" className="bg-surface">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Synchronizing Corporate Records..." />
        ) : isError ? (
          <ErrorState onRetry={() => loadBrands(selectedStatus)} />
        ) : filteredBrands.length === 0 ? (
          <div className="p-20 text-center text-xs font-black uppercase tracking-[0.3em] text-foreground/30 bg-card-bg border border-border rounded-[40px] shadow-sm">
            {selectedStatus === "approved" ? "No approved brands found" : "No brands found"}
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredBrands} 
            searchKey="company"
            placeholder="Query corporate infrastructure by company name or email..."
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
        onUpdate={() => loadBrands(selectedStatus)}
      />
    </DashboardShell>
  );
}
