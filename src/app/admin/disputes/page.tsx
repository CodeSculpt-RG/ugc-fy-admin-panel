"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge, StatCard } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { LoadingState, ErrorState, MissingTableState } from "@/app/components/ui/shared-states";
import { Dispute } from "@/app/types";
import { cn } from "@/app/lib/utils";
import { 
  Scale, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  CheckCircle2,
  ExternalLink,
  History,
  AlertCircle,
  Filter,
  RefreshCw,
  RefreshCcw,
  DollarSign
} from "lucide-react";

import { disputeService } from "@/app/services/financialServices";
import { useToast } from "@/app/hooks/useToast";
import { OpenDisputeModal } from "@/app/components/modals/OpenDisputeModal";
import { UserKycReviewPanel } from "@/app/components/ui/user-kyc-review-panel";
import { useRouter } from "next/navigation";

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [missingTableInfo, setMissingTableInfo] = useState<{ isMissing: boolean; name: string; sql: string }>({ isMissing: false, name: "", sql: "" });
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const { showToast } = useToast();

  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    variant: "danger" | "info" | "warning" | "success";
    showInput: boolean;
    confirmText: string;
    actionType: "resolve" | "refund" | "";
  }>({ 
    title: "", 
    description: "", 
    variant: "info",
    showInput: false,
    confirmText: "Confirm",
    actionType: ""
  });

  const loadDisputes = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setMissingTableInfo({ isMissing: false, name: "", sql: "" });
    try {
      const data = await disputeService.getDisputes();
      if (data.isMissingTable && data.tableName && data.migrationSql) {
        setMissingTableInfo({ isMissing: true, name: data.tableName, sql: data.migrationSql });
      } else {
        setDisputes(data.data);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[DisputesPage] Failed to fetch disputes:", { message: msg });
      setIsError(true);
      showToast(`Infrastructure synchronization failed: ${msg.slice(0, 50)}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadDisputes();
  }, [loadDisputes]);

  const stats = useMemo(() => {
    let activeCount = 0;
    let resolvedCount = 0;
    let totalEscrow = 0;

    disputes.forEach(d => {
      if (d.status === "In Review" || d.status === "Open") activeCount += 1;
      else if (d.status === "Resolved" || d.status === "Closed") resolvedCount += 1;
      
      if (d.status !== "Resolved" && d.status !== "Closed") {
        totalEscrow += 2500; // Average disputed escrow value
      }
    });

    return {
      total: disputes.length.toString(),
      active: activeCount.toString(),
      resolved: resolvedCount.toString(),
      escrow: `$${totalEscrow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      if (selectedStatus === "all") return true;
      if (selectedStatus === "active") return d.status === "In Review" || d.status === "Open";
      if (selectedStatus === "resolved") return d.status === "Resolved" || d.status === "Closed";
      return d.status.toLowerCase() === selectedStatus.toLowerCase();
    });
  }, [disputes, selectedStatus]);

  const handleAction = (dispute: Dispute, action: string) => {
    setSelectedDispute(dispute);
    if (action === "view") {
      setIsDrawerOpen(true);
    } else if (action === "chat") {
      showToast(`Opening secure mediation chat channel for INCIDENT_${dispute.id.slice(0, 8)}`, "info");
    } else if (action === "resolve") {
      setModalConfig({
        title: "Mediation Finalization Protocol",
        description: `Authorize final resolution for case ${dispute.id.slice(0, 8)}. Please state the exact administrative ruling and funds allocation directive.`,
        variant: "info",
        showInput: true,
        confirmText: "Execute Ruling",
        actionType: "resolve"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "refund") {
      setModalConfig({
        title: "Refund Escrow Protocol",
        description: `Authorize full refund to corporate brand ${dispute.brand}. This will close mediation case ${dispute.id.slice(0, 8)} in favor of brand.`,
        variant: "danger",
        showInput: true,
        confirmText: "Process Full Refund",
        actionType: "refund"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      if (modalConfig.actionType === "resolve" || modalConfig.actionType === "refund") {
        const ruling = reason || (modalConfig.actionType === "refund" ? "Full refund ruled in favor of corporate brand." : "Resolved by mutual administrative arbitration.");
        await disputeService.resolve(selectedDispute.id, ruling);
        showToast(`Dispute ${selectedDispute.id.slice(0, 8)} resolved successfully`, "success");
      }
      setIsConfirmModalOpen(false);
      setIsDrawerOpen(false);
      await loadDisputes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Mediation protocol failed";
      showToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<Dispute>[] = [
    {
      accessorKey: "id",
      header: "Infrastructure ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-[#F0F0FB]/20 font-mono tracking-tighter">{row.original.id.slice(0, 12)}...</span>,
    },
    {
      accessorKey: "type",
      header: "Incident Category",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3 py-2">
          <div className={cn(
            "p-2 rounded-xl border shadow-sm flex-shrink-0",
            row.original.type === "Fraud" ? "bg-accent-orange/10 border-accent-orange/15" : "bg-primary-blue/10 border-primary-blue/15"
          )}>
            <AlertTriangle className={cn(
              "w-4 h-4",
              row.original.type === "Fraud" ? "text-accent-orange" : "text-primary-blue"
            )} />
          </div>
          <span className="text-[11px] font-black text-[#F0F0FB] uppercase tracking-widest">{row.original.type}</span>
        </div>
      ),
    },
    {
      accessorKey: "campaign",
      header: "Contextual Brief",
      cell: ({ row }) => (
        <div className="space-y-1 min-w-0">
          <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight truncate">{row.original.campaign}</p>
          <p className="text-[10px] text-[#F0F0FB]/20 uppercase font-black tracking-widest truncate">{row.original.brand} <span className="mx-1 lowercase opacity-50">vs</span> {row.original.creator}</p>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Strategic Priority",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span className={cn(
            "text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border tracking-widest",
            row.original.priority === "Critical" ? "bg-accent-orange/10 border-accent-orange/15 text-accent-orange shadow-sm" : 
            row.original.priority === "High" ? "bg-primary-blue/10 border-primary-blue/15 text-primary-blue shadow-sm" : 
            "bg-white/[0.02] border-white/[0.08] text-[#F0F0FB]/30 shadow-inner"
          )}>
            {row.original.priority}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Operational State",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          variant={
            row.original.status === "Resolved" || row.original.status === "Closed" ? "success" : 
            row.original.status === "In Review" ? "warning" : 
            row.original.status === "Open" ? "info" : "default"
          } 
        />
      ),
    },
    {
      accessorKey: "openedDate",
      header: "Temporal Origin",
      cell: ({ row }) => <span className="text-[11px] font-black text-[#F0F0FB]/20 tracking-tighter">{row.original.openedDate}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isOpen = row.original.status !== "Resolved" && row.original.status !== "Closed";
        const disputeActions: ActionItem[] = [
          {
            label: "Review Case Evidence",
            icon: Scale,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Mediation Vectors"
          },
          {
            label: "Review Creator KYC Dossier",
            icon: ExternalLink,
            onClick: () => {
              if (row.original.creatorId) {
                setSelectedUserId(row.original.creatorId);
                setReviewPanelOpen(true);
              } else {
                showToast("Creator ID not found for this dispute.", "warning");
              }
            }
          },
          {
            label: "Review Brand KYC Dossier",
            icon: ExternalLink,
            onClick: () => {
              if (row.original.brandId) {
                setSelectedUserId(row.original.brandId);
                setReviewPanelOpen(true);
              } else {
                showToast("Brand ID not found for this dispute.", "warning");
              }
            }
          },
          {
            label: "Open Secure Channel",
            icon: MessageSquare,
            onClick: () => handleAction(row.original, "chat"),
            variant: "blue" as const
          },
          ...(isOpen ? [
            {
              label: "Authorize Ruling",
              icon: CheckCircle2,
              onClick: () => handleAction(row.original, "resolve"),
              variant: "blue" as const,
              isSeparator: true
            },
            {
              label: "Refund to Brand",
              icon: RefreshCcw,
              onClick: () => handleAction(row.original, "refund"),
              variant: "orange" as const
            }
          ] : [])
        ];

        return <ActionDropdown actions={disputeActions} />;
      },
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Mediation Infrastructure" 
          subtitle="Neutral resolution center for contract fulfillment and fiscal reconciliation between platform entities."
        >
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => loadDisputes()}
              disabled={isLoading}
              className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-white/[0.02] border border-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Docket</span>
            </button>
            <button 
              onClick={() => setIsOpenModalOpen(true)}
              className="flex items-center space-x-3 h-12 px-8 rounded-2xl bg-accent-orange text-white font-black text-[10px] uppercase tracking-widest hover:bg-accent-orange/90 transition-all shadow-xl shadow-accent-orange/20 active:scale-95"
            >
              <Scale className="w-4 h-4" />
              <span>Open Case</span>
            </button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <StatCard label="Total Disputes" value={stats.total} icon={Scale} color="blue" onClick={() => setSelectedStatus("all")} />
          <StatCard label="Active Arbitration" value={stats.active} icon={AlertCircle} color="orange" onClick={() => setSelectedStatus("active")} />
          <StatCard label="Resolved Rulings" value={stats.resolved} icon={CheckCircle2} color="success" onClick={() => setSelectedStatus("resolved")} />
          <StatCard label="Disputed Escrow" value={stats.escrow} icon={DollarSign} color="error" onClick={() => router.push("/admin/escrow?filter=disputed")} />
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-[#0F172A] border border-white/[0.08] mb-10 shadow-sm">
          <div className="flex items-center space-x-3 text-[#F0F0FB]/40 text-xs font-black uppercase tracking-widest">
            <Filter className="w-4 h-4 text-primary-blue" />
            <span>Docket Filters:</span>
          </div>

          <div className="flex items-center space-x-2 bg-[#111827] border border-white/[0.08] rounded-2xl px-4 py-2">
            <span className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-widest">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#F0F0FB] focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-[#111827]">All Incidents</option>
              <option value="active" className="bg-[#111827]">Active Incidents</option>
              <option value="resolved" className="bg-[#111827]">Resolved Rulings</option>
              <option value="Open" className="bg-[#111827]">Open Docket</option>
              <option value="In Review" className="bg-[#111827]">In Arbitration</option>
              <option value="Resolved" className="bg-[#111827]">Resolved</option>
              <option value="Closed" className="bg-[#111827]">Closed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Synchronizing Mediation Docket..." />
        ) : missingTableInfo.isMissing ? (
          <MissingTableState tableName={missingTableInfo.name} migrationSql={missingTableInfo.sql} />
        ) : isError ? (
          <ErrorState onRetry={loadDisputes} />
        ) : filteredDisputes.length === 0 ? (
          <div className="p-20 text-center text-xs font-black uppercase tracking-[0.3em] text-[#F0F0FB]/30 bg-[#0F172A] border border-white/[0.08] rounded-[40px] shadow-sm">
            No disputes found
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredDisputes} 
            searchKey="campaign"
            placeholder="Query mediation infrastructure by campaign brief..."
          />
        )}
      </div>

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedDispute ? `INCIDENT_${selectedDispute.id.slice(0, 8)}` : "Incident Profile"}
        subtitle={`${selectedDispute?.type || "MEDIATION_PROTOCOL"} Issue • Operational Lifecycle Brief`}
      >
        {selectedDispute && (
          <div className="space-y-12">
            <div className="space-y-10">
               <h4 className="stat-label">Mediation Chronology</h4>
               <div className="relative pl-10 space-y-12 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/[0.08] before:border-dashed before:border-l">
                  <div className="relative">
                     <div className="absolute -left-[37px] top-1 w-5 h-5 rounded-full bg-[#030712] border-4 border-[#F0F0FB]/20 shadow-md" />
                     <p className="text-base font-black text-[#F0F0FB] tracking-tight leading-none">Dispute Initiated</p>
                     <p className="text-[13px] font-medium text-[#F0F0FB]/40 mt-3 leading-relaxed">
                        <span className="font-black text-[#F0F0FB]/20 mr-2 uppercase tracking-widest text-[10px]">{selectedDispute.openedDate}</span>
                        Protocol: Alleged non-fulfillment of fiscal obligations following asset verification.
                     </p>
                  </div>
                  <div className="relative">
                     <div className="absolute -left-[37px] top-1 w-5 h-5 rounded-full bg-primary-blue border-4 border-[#F0F0FB]/10 shadow-lg shadow-primary-blue/20" />
                     <p className="text-base font-black text-[#F0F0FB] tracking-tight leading-none">Audit Assignment</p>
                     <p className="text-[13px] font-medium text-[#F0F0FB]/40 mt-3 leading-relaxed">
                        <span className="font-black text-[#F0F0FB]/20 mr-2 uppercase tracking-widest text-[10px]">Active</span>
                        Incident assigned to Senior Arbitrator for multi-stage forensic ledger review.
                     </p>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <h4 className="stat-label">Forensic Asset Locker</h4>
               <div className="grid grid-cols-1 gap-4">
                  {[
                    { name: "Campaign_Agreement_v2.pdf", size: "1.2 MB", icon: FileText },
                    { name: "Content_Approval_Log.png", size: "840 KB", icon: FileText },
                    { name: "Mediation_Audit_History.csv", size: "45 KB", icon: History }
                  ].map((file) => (
                    <div key={file.name} className="flex items-center justify-between p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.08] shadow-sm hover:border-primary-blue/20 transition-all cursor-pointer group">
                       <div className="flex items-center space-x-5">
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-[#F0F0FB]/20 group-hover:text-primary-blue transition-colors shadow-inner">
                            <file.icon className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-[#F0F0FB] tracking-tight leading-none">{file.name}</p>
                             <p className="stat-label mt-2">{file.size}</p>
                          </div>
                       </div>
                       <ExternalLink className="w-4 h-4 text-[#F0F0FB]/10 group-hover:text-primary-blue transition-colors mr-2" />
                    </div>
                  ))}
               </div>
            </div>

            {selectedDispute.status !== "Resolved" && selectedDispute.status !== "Closed" && (
              <div className="pt-12 border-t border-white/[0.08] space-y-8">
                 <h4 className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.4em]">Final Operational Resolution</h4>
                 <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => handleAction(selectedDispute, "resolve")}
                      className="h-16 rounded-[28px] bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
                    >
                      Authorize Asset Release (Favor Creator)
                    </button>
                    <button 
                      onClick={() => handleAction(selectedDispute, "refund")}
                      className="h-16 rounded-[28px] bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-accent-orange hover:text-white hover:border-accent-orange transition-all active:scale-95 shadow-sm"
                    >
                      Initiate Refund Protocol (Favor Brand)
                    </button>
                 </div>
              </div>
            )}
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
        loading={actionLoading}
      />

      <OpenDisputeModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        onSuccess={loadDisputes}
      />

      <UserKycReviewPanel
        isOpen={reviewPanelOpen}
        onClose={() => setReviewPanelOpen(false)}
        userId={selectedUserId}
        onUpdate={loadDisputes}
      />
    </DashboardShell>
  );
}
