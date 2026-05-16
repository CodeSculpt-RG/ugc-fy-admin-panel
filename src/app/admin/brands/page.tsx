"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Eye, 
  Building2, 
  CheckCircle2, 
  Briefcase,
  Globe,
  Mail,
  MapPin,
  Ban
} from "lucide-react";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { Brand } from "@/app/types";
import { brandService } from "@/app/services/brandService";
import { approvalService } from "@/app/services/approvalService";
import { normalizeError } from "@/lib/api/normalizeError";
import { useToast } from "@/app/hooks/useToast";
import { Zap, ShieldAlert } from "lucide-react";

export default function BrandsPage() {
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<Brand | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
  const { showToast } = useToast();
  
  const [modalConfig, setModalConfig] = React.useState<{
    title: string;
    description: string;
    variant: "info" | "danger" | "warning" | "success";
    showInput: boolean;
    confirmText: string;
    actionType: "approve" | "reject" | "block" | "billing" | "";
  }>({ 
    title: "", 
    description: "", 
    variant: "danger",
    showInput: false,
    confirmText: "Confirm",
    actionType: ""
  });

  const loadBrands = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await brandService.getBrands();
      setBrands(data);
    } catch (err) {
      console.error("[BrandsPage] Failed to load brands:", normalizeError(err));
      setIsError(true);
      showToast("Corporate infrastructure synchronization failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    const synchronize = async () => {
      await loadBrands();
    };
    synchronize();
  }, [loadBrands]);

  const handleAction = (brand: Brand, action: string) => {
    setSelectedBrand(brand);
    if (action === "view") {
      setIsDrawerOpen(true);
    } else if (action === "approve") {
      setModalConfig({
        title: "Approve Brand",
        description: `Are you sure you want to approve ${brand.name}? This will grant them authorization to launch campaigns.`,
        variant: "info",
        showInput: false,
        confirmText: "Approve Authorization",
        actionType: "approve"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "reject") {
      setModalConfig({
        title: "Reject Brand",
        description: `Please provide a reason for rejecting ${brand.name}'s business verification.`,
        variant: "danger",
        showInput: true,
        confirmText: "Reject Verification",
        actionType: "reject"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "block") {
      setModalConfig({
        title: "Access Restriction",
        description: `This will prevent ${brand.name} from launching new campaigns. Please provide a justification for this administrative protocol.`,
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
    try {
      const statusMap: Record<string, "approved" | "rejected" | "blocked" | "pending_review"> = {
        approve: "approved",
        reject: "rejected",
        block: "blocked",
        billing: "approved",
        "": "pending_review"
      };

      await approvalService.updateApprovalStatus(
        selectedBrand.id, 
        statusMap[modalConfig.actionType] || "pending_review",
        reason
      );

      showToast(`Corporate directive ${modalConfig.actionType} executed successfully`, "success");
      setIsConfirmModalOpen(false);
      loadBrands();
    } catch (err) {
      console.error("[BrandsPage] Administrative action failed:", normalizeError(err));
      showToast("Corporate directive failed to execute.", "error");
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
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-accent-orange/10 transition-all duration-500">
            <Building2 className="w-5 h-5 text-[#F0F0FB]/20 group-hover:text-accent-orange transition-colors" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
               <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight">{row.original.name}</p>
               {row.original.status === "Active" && <CheckCircle2 className="w-3.5 h-3.5 text-primary-blue" />}
            </div>
            <p className="text-[11px] font-black text-[#F0F0FB]/20 uppercase tracking-widest">{row.original.industry}</p>
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
            label: "Analyze Corporate Portfolio",
            icon: Eye,
            onClick: () => handleAction(row.original, "view"),
            sectionLabel: "Intelligence Vectors"
          },
          ...(row.original.approvalStatus === 'pending_review' ? [
            {
              label: "Authorize Entity",
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
            onClick={() => loadBrands()}
            className="flex items-center space-x-3 px-6 py-3 rounded-2xl bg-primary-blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Synchronize Corporate Network</span>
          </button>
        </PageHeader>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="p-6 rounded-[32px] bg-error/10 border border-error/20 text-error">
               <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-black text-[#F0F0FB]">Corporate Ledger Synchronization Failure</p>
              <p className="text-sm text-[#F0F0FB]/40">Unable to establish a secure handshake with the brand infrastructure ledger.</p>
            </div>
            <button 
              onClick={() => loadBrands()}
              className="h-12 px-8 rounded-2xl bg-white/[0.03] border border-white/10 text-[#F0F0FB] text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue hover:border-primary-blue transition-all active:scale-95"
            >
              Retry Handshake
            </button>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={brands} 
            isLoading={isLoading}
            searchKey="email"
            placeholder="Query corporate infrastructure by identifier..."
          />
        )}
      </div>

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedBrand?.name || "Corporate Profile"}
        subtitle={`${selectedBrand?.industry || "CORPORATE_ENTITY"} • STRATEGIC_PARTNER • VERIFIED_IDENTITY`}
      >
        {selectedBrand && (
          <div className="space-y-12">
            {/* Investment Intelligence */}
            <div className="p-10 rounded-[40px] bg-[#111827] border border-white/[0.08] space-y-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent" />
               
               <div className="flex justify-between items-end">
                  <div>
                    <p className="stat-label mb-2">Aggregate GMV</p>
                    <span className="text-4xl font-black text-[#F0F0FB] tracking-tighter">{selectedBrand.totalSpend}</span>
                  </div>
                  <div className="pb-1">
                    <span className="text-[10px] font-black text-primary-blue bg-primary-blue/10 px-4 py-2 rounded-xl border border-primary-blue/15 shadow-sm">GROWTH +12%</span>
                  </div>
               </div>
               <div className="h-px bg-white/[0.05] w-full" />
               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <p className="stat-label mb-2">Active Initiatives</p>
                     <p className="text-2xl font-black text-[#F0F0FB] tracking-tighter">{selectedBrand.activeCampaigns}</p>
                  </div>
                  <div>
                     <p className="stat-label mb-2">Creator Reach</p>
                     <p className="text-2xl font-black text-[#F0F0FB] tracking-tighter">42 <span className="text-xs text-[#F0F0FB]/20 font-bold ml-1">ENTITIES</span></p>
                  </div>
               </div>
            </div>


            {/* Corporate Metadata */}
            <div className="space-y-8">
               <h4 className="stat-label">Corporate Metadata</h4>
               <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: Globe, label: "Digital Infrastructure", value: `www.${selectedBrand.name.toLowerCase().replace(' ', '')}.com` },
                    { icon: Mail, label: "Administrative Endpoint", value: selectedBrand.email },
                    { icon: MapPin, label: "Geographic Origin", value: "New York, USA" }
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

            {/* Performance Ledger */}
            <div className="space-y-8">
               <h4 className="stat-label">Temporal Performance Ledger</h4>
               <div className="space-y-4">
                  {[
                    { label: "Contract Fulfillment", value: "98%", trend: "+2.4%" },
                    { label: "Engagement Velocity", value: "4.2%", trend: "+0.8%" },
                    { label: "Ecosystem ROI", value: "3.5x", trend: "+1.2x" }
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.08] shadow-sm hover:border-primary-blue/20 transition-all cursor-pointer">
                       <span className="text-[11px] text-[#F0F0FB]/30 font-black uppercase tracking-widest">{metric.label}</span>
                       <div className="flex items-center space-x-5">
                          <span className="text-base font-black text-[#F0F0FB] tracking-tighter">{metric.value}</span>
                          <span className="text-[10px] font-black text-primary-blue bg-primary-blue/10 px-3 py-1.5 rounded-xl border border-primary-blue/15 shadow-sm">{metric.trend}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Administrative Directives */}
            <div className="pt-12 border-t border-white/[0.08] space-y-8">
               <button className="w-full h-16 rounded-[28px] bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95">
                 Synthesize Strategic Intelligence
               </button>
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
