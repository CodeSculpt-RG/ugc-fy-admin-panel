"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge, formatINR } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { ColumnDef } from "@tanstack/react-table";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import { Campaign } from "@/app/types";
import { 
  Eye, 
  Play, 
  Pause, 
  XCircle,
  Building,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  RefreshCw
} from "lucide-react";
import { campaignService } from "@/app/services/campaignService";
import { useToast } from "@/app/hooks/useToast";

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    variant: "danger" | "info" | "warning" | "success";
    showInput: boolean;
    confirmText: string;
    actionType: "resume" | "pause" | "reject" | "";
  }>({ 
    title: "", 
    description: "", 
    variant: "danger",
    showInput: false,
    confirmText: "Confirm",
    actionType: ""
  });

  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await campaignService.getCampaigns();
      setLocalCampaigns(data);
    } catch (err) {
      console.error("[CampaignsPage] Infrastructure synchronization failure:", err);
      setIsError(true);
      showToast("Unable to sync campaign initiatives from the global ledger.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadCampaigns();
  }, [loadCampaigns]);

  const filteredCampaigns = useMemo(() => {
    return localCampaigns.filter(c => {
      if (selectedStatus === "all") return true;
      return c.status.toLowerCase() === selectedStatus.toLowerCase();
    });
  }, [localCampaigns, selectedStatus]);

  const handleAction = (campaign: Campaign, action: string) => {
    setSelectedCampaign(campaign);
    if (action === "view") {
      setIsDrawerOpen(true);
    } else if (action === "resume") {
      setModalConfig({
        title: "Initiative Resumption",
        description: `Are you sure you want to resume the "${campaign.title}" campaign? This will notify the corporate brand and all participating creators.`,
        variant: "info",
        showInput: false,
        confirmText: "Resume Operation",
        actionType: "resume"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "pause") {
      setModalConfig({
        title: "Operation Suspension",
        description: `This will temporarily suspend all activities for "${campaign.title}". Entities will not be able to submit new assets.`,
        variant: "warning",
        showInput: false,
        confirmText: "Suspend Operation",
        actionType: "pause"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "reject") {
      setModalConfig({
        title: "Initiative Termination",
        description: `Critical: This will permanently terminate the "${campaign.title}" campaign. Please provide a detailed justification for this security protocol.`,
        variant: "danger",
        showInput: true,
        confirmText: "Terminate Initiative",
        actionType: "reject"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedCampaign) return;
    setActionLoading(true);
    try {
      const statusMap: Record<string, string> = { resume: "Active", pause: "Paused", reject: "Rejected" };
      const newStatus = statusMap[modalConfig.actionType];
      
      await campaignService.updateStatus(selectedCampaign.id, newStatus, reason);
      
      showToast(`Campaign ${selectedCampaign.title} status updated to ${newStatus}`, "success");
      setIsConfirmModalOpen(false);
      await loadCampaigns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Campaign directive failed";
      showToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: "title",
      header: "Campaign Initiative",
      cell: ({ row }) => (
        <div className="flex items-center space-x-5 py-2">
          <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-accent-orange/10 transition-all duration-500 flex-shrink-0">
            <FileText className="w-5 h-5 text-foreground/20 group-hover:text-accent-orange transition-colors" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-[15px] font-black text-foreground tracking-tight truncate">{row.original.title}</p>
            <p className="text-[11px] font-black text-foreground/20 uppercase tracking-widest truncate">{row.original.brand}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "budget",
      header: "Fiscal Allocation",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span className="text-[15px] font-black text-foreground tracking-tighter">
            {formatINR(row.original.budget.replace(/[^0-9.]/g, ''))}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "creators",
      header: "Network Density",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2.5 text-[11px] font-black text-foreground/40 tracking-widest">
          <Users className="w-3.5 h-3.5" />
          <span>{row.original.submissions} SUBMISSIONS</span>
        </div>
      ),
    },
    {
      accessorKey: "submissions",
      header: "Asset Progress",
      cell: ({ row }) => {
        const progress = Math.min((row.original.submissions / Math.max(row.original.creators, 1)) * 100, 100);
        return (
          <div className="w-40 space-y-2.5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/20">
              <span>{row.original.submissions}/{row.original.creators} ASSETS</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-elevated hover:bg-foreground/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "deadline",
      header: "Temporal Threshold",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2.5 text-[11px] font-black text-foreground/40 tracking-tight">
          <Calendar className="w-3.5 h-3.5" />
          <span>{row.original.deadline}</span>
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
            row.original.status === "Active" ? "success" : 
            row.original.status === "Completed" ? "info" : 
            row.original.status === "Pending" ? "warning" : 
            row.original.status === "Disputed" ? "error" : "default"
          } 
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const campaignActions: ActionItem[] = [
          {
            label: "Analyze Initiative Brief",
            icon: Eye,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Intelligence Directives"
          },
          ...(row.original.status === 'Paused' ? [{
            label: "Resume Operation",
            icon: Play,
            onClick: () => handleAction(row.original, "resume"),
            variant: "blue" as const
          }] : row.original.status === 'Active' ? [{
            label: "Suspend Operation",
            icon: Pause,
            onClick: () => handleAction(row.original, "pause"),
            variant: "orange" as const
          }] : []),
          {
            label: "Terminate Initiative",
            icon: XCircle,
            onClick: () => handleAction(row.original, "reject"),
            variant: "orange",
            isSeparator: true
          }
        ];

        return <ActionDropdown actions={campaignActions} />;
      },
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Campaign Infrastructure" 
          subtitle="Enterprise monitoring and moderation of global influencer marketing initiatives."
        >
          <button 
            onClick={() => loadCampaigns()}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Data</span>
          </button>
        </PageHeader>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-card-bg border border-border mb-10 shadow-sm">
          <div className="flex items-center space-x-3 text-text-secondary text-sm font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filters:</span>
          </div>

          <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
            <span className="text-xs text-text-secondary">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-surface">All Statuses</option>
              <option value="Active" className="bg-surface">Active</option>
              <option value="Draft" className="bg-surface">Draft</option>
              <option value="Pending" className="bg-surface">Pending</option>
              <option value="Paused" className="bg-surface">Paused</option>
              <option value="Completed" className="bg-surface">Completed</option>
              <option value="Rejected" className="bg-surface">Rejected</option>
              <option value="Disputed" className="bg-surface">Disputed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Synchronizing Campaign Initiatives..." />
        ) : isError ? (
          <ErrorState onRetry={loadCampaigns} />
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredCampaigns} 
            searchKey="title"
            placeholder="Query campaign initiatives by title..."
          />
        )}
      </div>

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedCampaign?.title || "Initiative Profile"}
        subtitle={`${selectedCampaign?.brand || "CORPORATE_ENTITY"} • Operational Lifecycle Brief`}
      >
        {selectedCampaign && (
          <div className="space-y-12">
            {/* Fiscal State */}
            <div className="p-10 rounded-[40px] bg-surface border border-border space-y-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
               
              <div className="flex justify-between items-end">
                <div>
                  <p className="stat-label mb-2">Fiscal Allocation</p>
                  <span className="text-4xl font-black text-foreground tracking-tighter">
                    {formatINR(selectedCampaign.budget.replace(/[^0-9.]/g, ''))}
                  </span>
                </div>
                <div className="pb-1">
                  <StatusBadge status="Fully Authorized" variant="success" />
                </div>
              </div>
              <div className="h-px bg-surface-elevated hover:bg-foreground/5 w-full" />

              <div className="flex justify-between items-center">
                <span className="stat-label">Escrow Protocol</span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/15 uppercase tracking-widest shadow-sm">Active</span>
              </div>
            </div>

            {/* Infrastructure Metadata */}
            <div className="space-y-8">
               <h4 className="stat-label">Initiative Metadata</h4>
               <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: Building, label: "Parent Entity", value: selectedCampaign.brand },
                    { icon: DollarSign, label: "Operational Overhead (15%)", value: formatINR(Number(selectedCampaign.budget.replace(/[^0-9.]/g, '')) * 0.15) },
                    { icon: Users, label: "Assigned Creator", value: selectedCampaign.creator_profile?.full_name || selectedCampaign.creator_profile?.email || "Unassigned Network Node" }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center space-x-6 p-6 rounded-[28px] bg-surface-elevated border border-border shadow-sm group cursor-pointer hover:border-primary/20 transition-all min-w-0">
                      <div className="p-4 rounded-2xl bg-surface-elevated border border-border text-foreground/20 group-hover:text-primary transition-colors flex-shrink-0">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="stat-label leading-none">{item.label}</p>
                        <p className="text-base font-black text-foreground mt-2 tracking-tight truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Asset Ledger */}
            <div className="space-y-8">
               <h4 className="stat-label">Verified Asset Ledger</h4>
                <div className="grid grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-video rounded-[28px] bg-surface-elevated border border-border overflow-hidden group relative shadow-sm hover:border-primary/20 transition-all cursor-pointer">
                       <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                          <Eye className="w-8 h-8 text-primary" />
                       </div>
                       <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-[9px] font-black text-foreground uppercase tracking-widest">ASSET_VECTOR_SUB_{i}092</p>
                       </div>
                    </div>
                  ))}
               </div>
               <button className="w-full h-16 rounded-[28px] bg-surface-elevated border border-border text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95 shadow-sm">
                  Access Full Asset Ledger ({selectedCampaign.submissions})
               </button>
            </div>

            {/* Security Protocol */}
            <div className="pt-12 border-t border-border space-y-8">
               <h4 className="text-[10px] font-black text-error/40 uppercase tracking-[0.4em]">Administrative Security Protocol</h4>
               <div className="grid grid-cols-2 gap-4">
                  {selectedCampaign.status === 'Paused' ? (
                    <button 
                      onClick={() => { setIsDrawerOpen(false); handleAction(selectedCampaign, "resume"); }}
                      className="h-16 rounded-[28px] bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                    >
                      Resume Campaign
                    </button>
                  ) : selectedCampaign.status === 'Active' ? (
                    <button 
                      onClick={() => { setIsDrawerOpen(false); handleAction(selectedCampaign, "pause"); }}
                      className="h-16 rounded-[28px] bg-accent-orange text-white font-black text-[10px] uppercase tracking-widest hover:bg-accent-orange/90 transition-all shadow-xl shadow-accent-orange/20 active:scale-95"
                    >
                      Suspend Campaign
                    </button>
                  ) : null}
                  <button 
                    onClick={() => { setIsDrawerOpen(false); handleAction(selectedCampaign, "reject"); }}
                    className="h-16 col-span-2 rounded-[28px] bg-surface-elevated border border-border text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-error hover:text-white hover:border-error transition-all active:scale-95 shadow-sm"
                  >
                    Terminate Initiative
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
        loading={actionLoading}
      />
    </DashboardShell>
  );
}
