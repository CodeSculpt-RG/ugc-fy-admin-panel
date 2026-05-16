"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { Dispute } from "@/app/types";
import { cn } from "@/app/lib/utils";
import { 
  Scale, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  CheckCircle2,
  ExternalLink,
  History
} from "lucide-react";

import { disputeService } from "@/app/services/financialServices";
import { useToast } from "@/app/hooks/useToast";

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();

  const [modalConfig, setModalConfig] = useState({ 
    title: "", 
    description: "", 
    variant: "danger" as "danger" | "info" | "warning" | "success",
    showInput: false,
    confirmText: "Confirm",
    actionType: "" as "resolve" | ""
  });

  React.useEffect(() => {
    const loadDisputes = async () => {
      try {
        const data = await disputeService.getDisputes();
        setDisputes(data);
      } catch (error) {
        console.error("[DisputesPage] Failed to fetch disputes:", error);
        showToast("Infrastructure synchronization failed.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadDisputes();
  }, [showToast]);

  const handleAction = (dispute: Dispute, action: string) => {
    setSelectedDispute(dispute);
    if (action === "view") {
      setIsDrawerOpen(true);
    } else if (action === "chat") {
      showToast(`Opening secure chat for ${dispute.id}`, "info");
    } else if (action === "resolve") {
      setModalConfig({
        title: "Mediation Finalization",
        description: `Are you sure you want to resolve case ${dispute.id}? This will close the mediation and execute the selected fiscal resolution protocol.`,
        variant: "info",
        showInput: true,
        confirmText: "Resolve Case",
        actionType: "resolve"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedDispute) return;
    try {
      await disputeService.resolve(selectedDispute.id, reason || "Manual resolution");
      showToast(`Dispute ${selectedDispute.id} resolved`, "success");
      setIsConfirmModalOpen(false);
    } catch {
      showToast("Mediation protocol failed", "error");
    }
  };


  const columns: ColumnDef<Dispute>[] = [
    {
      accessorKey: "id",
      header: "Infrastructure ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-[#F0F0FB]/20 font-mono tracking-tighter">{row.original.id}</span>,
    },
    {
      accessorKey: "type",
      header: "Incident Category",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3 py-2">
          <div className={cn(
            "p-2 rounded-xl border shadow-sm",
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
        <div className="space-y-1">
          <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight">{row.original.campaign}</p>
          <p className="text-[10px] text-[#F0F0FB]/20 uppercase font-black tracking-widest">{row.original.brand} <span className="mx-1 lowercase opacity-50">vs</span> {row.original.creator}</p>
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
            row.original.status === "Resolved" ? "success" : 
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
        const disputeActions: ActionItem[] = [
          {
            label: "Review Forensic Evidence",
            icon: Scale,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Mediation Vectors"
          },
          {
            label: "Open Secure Chat",
            icon: MessageSquare,
            onClick: () => handleAction(row.original, "chat"),
            variant: "blue"
          },
          {
            label: "Resolve Incident",
            icon: CheckCircle2,
            onClick: () => handleAction(row.original, "resolve"),
            variant: "blue",
            isSeparator: true
          }
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
        />

        <DataTable 
          columns={columns} 
          data={disputes} 
          isLoading={isLoading}
          searchKey="id"
          placeholder="Query mediation infrastructure by INCIDENT_ID..."
        />

      </div>

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedDispute?.id || "Incident Profile"}
        subtitle={`${selectedDispute?.type || "MEDIATION_PROTOCOL"} Issue • Operational Lifecycle Brief`}
      >
        {selectedDispute && (
          <div className="space-y-12">
            {/* Chronology */}
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
                        <span className="font-black text-[#F0F0FB]/20 mr-2 uppercase tracking-widest text-[10px]">2h AGO</span>
                        Incident assigned to Senior Arbitrator for multi-stage forensic ledger review.
                     </p>
                  </div>
               </div>
            </div>

            {/* Evidence Locker */}
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

            {/* Admin Directives */}
            <div className="pt-12 border-t border-white/[0.08] space-y-8">
               <h4 className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.4em]">Final Operational Resolution</h4>
               <div className="grid grid-cols-1 gap-4">
                  <button className="h-16 rounded-[28px] bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95">
                    Authorize Asset Release
                  </button>
                  <button className="h-16 rounded-[28px] bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-accent-orange hover:text-white hover:border-accent-orange transition-all active:scale-95 shadow-sm">
                    Initiate Refund Protocol
                  </button>
                  <button className="h-16 rounded-[28px] bg-white/[0.01] border border-white/5 text-[#F0F0FB]/30 font-black text-[10px] uppercase tracking-widest hover:text-[#F0F0FB] transition-all">
                    Request Intelligence Sync
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
