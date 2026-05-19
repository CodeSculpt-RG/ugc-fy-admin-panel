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
      accessorKey: "email",
      header: "Email",
      enableHiding: true,
      cell: () => null,
    },
    {
      accessorKey: "name",
      header: "Corporate Entity",
      cell: ({ row }) => (
        <div className="flex items-center space-x-5 py-2">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-accent-orange/10 transition-all duration-500 flex-shrink-0">
            <Building2 className="w-5 h-5 text-[#F0F0FB]/20 group-hover:text-accent-orange transition-colors" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
               <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight truncate">{row.original.name}</p>
               {(row.original.approvalStatus === "approved" || row.original.status === "Active") && <CheckCircle2 className="w-3.5 h-3.5 text-primary-blue flex-shrink-0" />}
            </div>
            <p className="text-[11px] font-black text-[#F0F0FB]/20 uppercase tracking-widest truncate">{row.original.industry}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "activeCampaigns",
      header: "Active Initiatives",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2.5 text-[11px] font-black text-[#F0F0FB]/40 tracking-widest">
          <Briefcase className="w-3.5 h-3.5" />
          <span>{row.original.activeCampaigns} ACTIVE</span>
        </div>
      ),
    },
    {
      accessorKey: "totalSpend",
      header: "Aggregate GMV",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-black text-primary-blue opacity-40">$</span>
          <span className="text-[15px] font-black text-[#F0F0FB] tracking-tighter">{row.original.totalSpend.replace('$', '')}</span>
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
            className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-primary-blue text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Synchronize Corporate Network</span>
          </button>
        </PageHeader>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-[#0F172A] border border-white/[0.08] mb-10 shadow-sm">
          <div className="flex items-center space-x-3 text-[#F0F0FB]/40 text-xs font-black uppercase tracking-widest">
            <Filter className="w-4 h-4 text-primary-blue" />
            <span>Brand Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-[#111827] border border-white/[0.08] rounded-2xl px-4 py-2">
              <span className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-widest">Industry:</span>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#F0F0FB] focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-[#111827]">All Industries</option>
                {uniqueIndustries.map(ind => (
                  <option key={ind} value={ind} className="bg-[#111827]">{ind}</option>
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
          <LoadingState message="Synchronizing Corporate Records..." />
        ) : isError ? (
          <ErrorState onRetry={() => loadBrands(selectedStatus)} />
        ) : filteredBrands.length === 0 ? (
          <div className="p-20 text-center text-xs font-black uppercase tracking-[0.3em] text-[#F0F0FB]/30 bg-[#0F172A] border border-white/[0.08] rounded-[40px] shadow-sm">
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
