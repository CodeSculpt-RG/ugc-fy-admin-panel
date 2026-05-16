"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { ColumnDef } from "@tanstack/react-table";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
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
  ShieldAlert
} from "lucide-react";

import { campaignService } from "@/app/services/campaignService";
import { useToast } from "@/app/hooks/useToast";

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  
  const [modalConfig, setModalConfig] = useState({ 
    title: "", 
    description: "", 
    variant: "danger" as "danger" | "info" | "warning" | "success",
    showInput: false,
    confirmText: "Confirm",
    actionType: "" as "resume" | "pause" | "reject"
  });

  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadCampaigns = React.useCallback(async () => {
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

  React.useEffect(() => {
    const synchronize = async () => {
      await loadCampaigns();
    };
    synchronize();
  }, [loadCampaigns]);

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
    try {
      const statusMap: Record<string, string> = { resume: "Active", pause: "Paused", reject: "Rejected" };
      const newStatus = statusMap[modalConfig.actionType];
      
      await campaignService.updateStatus(selectedCampaign.id, newStatus, reason);
      
      showToast(`Campaign ${selectedCampaign.title} status updated to ${newStatus}`, "success");
      setIsConfirmModalOpen(false);
      loadCampaigns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Campaign directive failed";
      showToast(message, "error");
    }
  };


  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: "title",
      header: "Campaign Initiative",

      cell: ({ row }) => (
        <div className="flex items-center space-x-5 py-2">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-accent-orange/10 transition-all duration-500">
            <FileText className="w-5 h-5 text-[#F0F0FB]/20 group-hover:text-accent-orange transition-colors" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight">{row.original.title}</p>
            <p className="text-[11px] font-black text-[#F0F0FB]/20 uppercase tracking-widest">{row.original.brand}</p>
          </div>


        </div>
      ),
    },
    {
      accessorKey: "budget",
      header: "Fiscal Allocation",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-black text-primary-blue opacity-40">$</span>
          <span className="text-[15px] font-black text-[#F0F0FB] tracking-tighter">{row.original.budget.replace('$', '')}</span>
        </div>

      ),
    },
    {
      accessorKey: "creators",
      header: "Network Density",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2.5 text-[11px] font-black text-[#F0F0FB]/40 tracking-widest">
          <Users className="w-3.5 h-3.5" />
          <span>{row.original.submissions} SUBMISSIONS</span>
        </div>
      ),
    },
    {
      accessorKey: "submissions",
      header: "Asset Progress",
      cell: ({ row }) => {
        const progress = Math.min((row.original.submissions / 100) * 100, 100); // Mock progress

        return (
          <div className="w-40 space-y-2.5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#F0F0FB]/20">
              <span>{row.original.submissions}/100 ASSETS</span>
              <span>{Math.round(progress)}%</span>
            </div>


            <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-blue transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
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
        <div className="flex items-center space-x-2.5 text-[11px] font-black text-[#F0F0FB]/40 tracking-tight">
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
          {
            label: "Resume Operation",
            icon: Play,
            onClick: () => handleAction(row.original, "resume"),
            variant: "blue"
          },
          {
            label: "Suspend Operation",
            icon: Pause,
            onClick: () => handleAction(row.original, "pause"),
            variant: "orange"
          },
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
          <button className="px-6 py-3 rounded-2xl bg-primary-blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95">
            Initiate Campaign
          </button>
        </PageHeader>


        {isError ? (
          <div className="p-20 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto text-error">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-white">Synchronization Error</p>
              <p className="text-sm text-white/30 max-w-md mx-auto italic">Protocol failure while fetching campaign initiatives. Please verify administrative credentials.</p>
            </div>
            <button 
              onClick={() => loadCampaigns()}
              className="px-8 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Retry Protocol
            </button>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={localCampaigns} 
            isLoading={isLoading}
            searchKey="title"
            placeholder="Query campaign initiatives..."
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
            <div className="p-10 rounded-[40px] bg-[#111827] border border-white/[0.08] space-y-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent" />
               
              <div className="flex justify-between items-end">
                <div>
                  <p className="stat-label mb-2">Fiscal Allocation</p>
                  <span className="text-4xl font-black text-[#F0F0FB] tracking-tighter">{selectedCampaign.budget}</span>
                </div>
                <div className="pb-1">
                  <StatusBadge status="Fully Authorized" variant="success" />
                </div>
              </div>
              <div className="h-px bg-white/[0.05] w-full" />

              <div className="flex justify-between items-center">
                <span className="stat-label">Escrow Protocol</span>
                <span className="text-[10px] font-black text-primary-blue bg-primary-blue/10 px-3 py-1.5 rounded-xl border border-primary-blue/15 uppercase tracking-widest shadow-sm">Active</span>
              </div>
            </div>

            {/* Infrastructure Metadata */}
            <div className="space-y-8">
               <h4 className="stat-label">Initiative Metadata</h4>
               <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: Building, label: "Parent Entity", value: selectedCampaign.brand },
                    { icon: DollarSign, label: "Operational Overhead (15%)", value: "$1,800.00" }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center space-x-6 p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.08] shadow-sm group cursor-pointer hover:border-primary-blue/20 transition-all">
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-[#F0F0FB]/20 group-hover:text-primary-blue transition-colors">
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

            {/* Asset Ledger */}
            <div className="space-y-8">
               <h4 className="stat-label">Verified Asset Ledger</h4>
                <div className="grid grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-video rounded-[28px] bg-white/[0.02] border border-white/[0.08] overflow-hidden group relative shadow-sm hover:border-primary-blue/20 transition-all cursor-pointer">
                       <div className="absolute inset-0 flex items-center justify-center bg-primary-blue/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                          <Eye className="w-8 h-8 text-primary-blue" />
                       </div>
                       <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-[9px] font-black text-[#F0F0FB] uppercase tracking-widest">ASSET_VECTOR_SUB_{i}092</p>
                       </div>
                    </div>
                  ))}
               </div>
               <button className="w-full h-16 rounded-[28px] bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95 shadow-sm">
                  Access Full Asset Ledger ({selectedCampaign.submissions})
               </button>

            </div>

            {/* Security Protocol */}
            <div className="pt-12 border-t border-white/[0.08] space-y-8">
               <h4 className="text-[10px] font-black text-error/40 uppercase tracking-[0.4em]">Administrative Security Protocol</h4>
               <div className="grid grid-cols-2 gap-4">
                  <button className="h-16 rounded-[28px] bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95">
                    Authorize Campaign
                  </button>
                  <button className="h-16 rounded-[28px] bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-error hover:text-white hover:border-error transition-all active:scale-95 shadow-sm">
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
      />
    </DashboardShell>
  );
}
