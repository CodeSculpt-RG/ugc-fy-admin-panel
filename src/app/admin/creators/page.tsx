"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Eye, 
  CheckCircle2, 
  User as UserIcon,
  Star,
  TrendingUp,
  ExternalLink,
  Globe,
  Zap,
  Ban,
  ShieldAlert
} from "lucide-react";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { Creator } from "@/app/types";
import { creatorService } from "@/app/services/creatorService";
import { approvalService } from "@/app/services/approvalService";
import { supabase } from "@/lib/supabase/client";
import { normalizeError } from "@/lib/api/normalizeError";
import { useToast } from "@/app/hooks/useToast";

export default function CreatorsPage() {
  const [creators, setCreators] = React.useState<Creator[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const [selectedCreator, setSelectedCreator] = React.useState<Creator | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
  const { showToast } = useToast();
  
  const [modalConfig, setModalConfig] = React.useState<{
    title: string;
    description: string;
    variant: "info" | "danger" | "warning" | "success";
    showInput: boolean;
    confirmText: string;
    actionType: "approve" | "reject" | "block" | "verify" | "";
  }>({ 
    title: "", 
    description: "", 
    variant: "danger",
    showInput: false,
    confirmText: "Confirm",
    actionType: ""
  });

  const loadCreators = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const data = await creatorService.getCreators();
      setCreators(data);
    } catch (err) {
      console.error("[CreatorsPage] Failed to load creators:", normalizeError(err));
      setIsError(true);
      showToast("Infrastructure synchronization failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    const synchronize = async () => {
      await loadCreators();
    };
    synchronize();
  }, [loadCreators]);

  const handleAction = (creator: Creator, action: string) => {
    setSelectedCreator(creator);
    if (action === "view") {
      setIsDrawerOpen(true);
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
        description: `Please provide a reason for rejecting ${creator.name}'s application.`,
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
    try {
      const statusMap: Record<string, "approved" | "rejected" | "blocked" | "pending_review"> = {
        approve: "approved",
        reject: "rejected",
        block: "blocked",
        verify: "approved",
        "": "pending_review"
      };

      await approvalService.updateApprovalStatus(
        selectedCreator.id, 
        statusMap[modalConfig.actionType] || "pending_review",
        reason
      );

      showToast(`Protocol ${modalConfig.actionType} executed successfully`, "success");
      setIsConfirmModalOpen(false);
      loadCreators();
    } catch (error) {
      console.error("[CreatorsPage] Action failed:", normalizeError(error));
      showToast("Administrative protocol failed: transaction rejected.", "error");
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
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-primary-blue/10 transition-all duration-500">
            <UserIcon className="w-5 h-5 text-[#F0F0FB]/20 group-hover:text-primary-blue transition-colors" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight">{row.original.name}</p>
            <p className="text-[11px] font-black text-[#F0F0FB]/20 uppercase tracking-widest">{row.original.email}</p>
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
            label: "Analyze Portfolio Assets",
            icon: Eye,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Operational Directives"
          },
          ...(row.original.approvalStatus === 'pending_review' ? [
            {
              label: "Approve Profile",
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
            onClick={() => loadCreators()}
            className="flex items-center space-x-3 px-6 py-3 rounded-2xl bg-primary-blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Synchronize Network</span>
          </button>
        </PageHeader>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="p-6 rounded-[32px] bg-error/10 border border-error/20 text-error">
               <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-black text-[#F0F0FB]">Network Synchronization Failure</p>
              <p className="text-sm text-[#F0F0FB]/40">Unable to establish a secure handshake with the creator database infrastructure.</p>
            </div>
            <button 
              onClick={() => loadCreators()}
              className="h-12 px-8 rounded-2xl bg-white/[0.03] border border-white/10 text-[#F0F0FB] text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue hover:border-primary-blue transition-all active:scale-95"
            >
              Retry Handshake
            </button>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={creators} 
            isLoading={isLoading}
            searchKey="email"
            placeholder="Query creator infrastructure by identifier..."
          />
        )}
      </div>

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedCreator?.name || "Entity Profile"}
        subtitle={`Administrative ID: ${selectedCreator?.niche || "STRATEGIC_PARTNER"} • VERIFIED_IDENTITY`}
      >
        {selectedCreator && (
          <div className="space-y-12">
            {/* Aggregate Metrics */}
            <div className="flex items-center justify-around p-10 rounded-[40px] bg-[#111827] border border-white/[0.08] shadow-sm">
               <div className="text-center">
                  <p className="text-3xl font-black text-[#F0F0FB] tracking-tighter">{selectedCreator.followers}</p>
                  <p className="stat-label mt-2">Reach</p>
               </div>
               <div className="w-px h-12 bg-white/[0.05]" />
               <div className="text-center">
                  <p className="text-3xl font-black text-[#F0F0FB] tracking-tighter">{selectedCreator.rating}</p>
                  <p className="stat-label mt-2">Trust</p>
               </div>
               <div className="w-px h-12 bg-white/[0.05]" />
               <div className="text-center">
                  <p className="text-3xl font-black text-primary-blue tracking-tighter">{selectedCreator.earnings}</p>
                  <p className="stat-label mt-2">Revenue</p>
               </div>
            </div>


            {/* Infrastructure Credentials */}
            <div className="space-y-8">
               <h4 className="stat-label">Infrastructure Metadata</h4>
               <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-5 p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.08] shadow-sm group cursor-pointer hover:border-primary-blue/20 transition-all">
                     <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-[#F0F0FB]/20 group-hover:text-primary-blue transition-colors">
                        <Globe className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="stat-label leading-none">Network ID</p>
                        <span className="text-sm font-black text-[#F0F0FB] mt-2 inline-block tracking-tight">{selectedCreator.email.split('@')[0]}</span>
                     </div>
                  </div>

                  <div className="flex items-center space-x-5 p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.08] shadow-sm group cursor-pointer hover:border-accent-orange/20 transition-all">
                     <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-[#F0F0FB]/20 group-hover:text-accent-orange transition-colors">
                        <Zap className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="stat-label leading-none">Protocol</p>
                        <span className="text-sm font-black text-[#F0F0FB] mt-2 inline-block tracking-tight">Verified Tier</span>
                     </div>
                  </div>

               </div>
            </div>

            {/* Asset Ledger */}
            <div className="space-y-8">
               <h4 className="stat-label">Verified Asset Ledger</h4>
               <div className="grid grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square rounded-[28px] bg-white/[0.02] border border-white/[0.08] overflow-hidden group relative shadow-sm hover:border-primary-blue/30 transition-all cursor-pointer">
                       <div className="absolute inset-0 bg-primary-blue/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md">
                          <ExternalLink className="w-6 h-6 text-primary-blue" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Admin Directives */}
            <div className="pt-12 border-t border-white/[0.08] space-y-8">
               <h4 className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.4em]">Operational Insights</h4>
               <div className="p-8 rounded-[32px] bg-black/[0.1] border border-white/[0.03] italic text-[13px] text-[#F0F0FB]/50 font-medium leading-relaxed shadow-inner">
                 &quot;Historical performance indicates strong engagement across lifestyle segments. Recommended for high-velocity campaign integration.&quot;
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
