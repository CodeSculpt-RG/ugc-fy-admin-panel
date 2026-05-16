"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge, StatCard } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Lock, 
  Unlock, 
  Snowflake, 
  AlertCircle,
  ArrowRightLeft,
  ShieldCheck,
  Building,
  User as UserIcon
} from "lucide-react";
import { Escrow } from "@/app/types";
import { cn } from "@/app/lib/utils";

import { escrowService } from "@/app/services/financialServices";
import { useToast } from "@/app/hooks/useToast";

export default function EscrowPage() {
  const { showToast } = useToast();
  const [localEscrow, setLocalEscrow] = React.useState<Escrow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadEscrow = async () => {
      try {
        const data = await escrowService.getEscrowList();
        setLocalEscrow(data);
      } catch (error) {
        console.error("[EscrowPage] Failed to fetch escrow ledger:", error);
        showToast("Infrastructure synchronization failed.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadEscrow();
  }, [showToast]);

  const handleRelease = async (id: string) => {
    try {
      await escrowService.release(id);
      showToast(`Escrow ${id} released successfully`, "success");
      setLocalEscrow(prev => prev.map(e => e.id === id ? { ...e, status: "Released" } : e));
    } catch {
      showToast("Release protocol failed", "error");
    }
  };

  const handleFreeze = async (id: string) => {
    try {
      await escrowService.freeze(id, "Administrative freeze");
      showToast(`Escrow ${id} frozen`, "warning");
      setLocalEscrow(prev => prev.map(e => e.id === id ? { ...e, status: "Frozen" } : e));
    } catch {
      showToast("Freeze protocol failed", "error");
    }
  };

  const columns: ColumnDef<Escrow>[] = [
    {
      accessorKey: "id",
      header: "Infrastructure ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-[#F0F0FB]/20 font-mono tracking-tighter">{row.original.id}</span>,

    },
    {
      accessorKey: "campaign",
      header: "Campaign Initiative",
      cell: ({ row }) => (
        <div className="py-1">
          <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight leading-none">{row.original.campaign}</p>

          <div className="flex items-center space-x-3 mt-2">
             <div className="flex items-center space-x-1.5 text-[9px] text-[#F0F0FB]/30 uppercase font-black tracking-widest">
                <Building className="w-3 h-3" />
                <span>{row.original.brand}</span>
             </div>
             <span className="text-[#F0F0FB]/10">•</span>
             <div className="flex items-center space-x-1.5 text-[9px] text-[#F0F0FB]/30 uppercase font-black tracking-widest">
                <UserIcon className="w-3 h-3" />
                <span>{row.original.creator}</span>
             </div>
          </div>

        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Fiscal Allocation",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-black text-primary-blue opacity-40">$</span>
          <span className="text-[15px] font-black text-[#F0F0FB] tracking-tighter">{row.original.amount.replace('$', '')}</span>
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
            row.original.status === "Released" ? "success" : 
            row.original.status === "Held" ? "warning" : 
            row.original.status === "Frozen" ? "error" : "default"
          } 
        />
      ),
    },
    {
      accessorKey: "releaseDate",
      header: "Temporal Threshold",
      cell: ({ row }) => <span className="text-[11px] font-black text-[#F0F0FB]/20 tracking-tighter uppercase">{row.original.releaseDate}</span>,

    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right flex items-center justify-end space-x-3">
          {row.original.status === "Held" && (
            <button 
              onClick={() => handleRelease(row.original.id)}
              className="h-9 px-4 rounded-xl bg-primary-blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-lg shadow-primary-blue/20 active:scale-95"
            >
              Authorize Release
            </button>

          )}
          {row.original.status === "Held" && (
            <button 
              onClick={() => handleFreeze(row.original.id)}
              className="h-9 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-error hover:text-white hover:border-error transition-all active:scale-95 shadow-sm"
            >
              Freeze Assets
            </button>

          )}
        </div>

      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Escrow Infrastructure" 
          subtitle="Enterprise management of secured fiscal vectors and automated release protocols."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard label="Aggregate Escrow" value="$1.2M" icon={Lock} color="blue" />
          <StatCard label="Scheduled Release" value="$42,500" icon={Unlock} color="success" />
          <StatCard label="Frozen Assets" value="$15,000" icon={Snowflake} color="error" />
          <StatCard label="Incident Disputes" value="8" icon={AlertCircle} color="orange" />
        </div>

        {/* Protocol Lifecycle Visualization */}
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-[40px] p-10 overflow-hidden relative shadow-premium">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent" />
          
          <div className="flex items-center justify-between relative z-10 max-w-5xl mx-auto">
            {[
              { label: "Pay In", icon: Building, color: "blue" },
              { label: "Secure Hold", icon: Lock, color: "orange" },
              { label: "Validation", icon: ShieldCheck, color: "orange" },
              { label: "Audit", icon: AlertCircle, color: "orange" },
              { label: "Release", icon: ArrowRightLeft, color: "success" },
            ].map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center space-y-4">
                  <div className={cn(
                    "w-16 h-16 rounded-[22px] flex items-center justify-center border transition-all duration-500 shadow-sm",
                    step.color === "blue" ? "bg-primary-blue/10 border-primary-blue/15 text-primary-blue shadow-primary-blue/10" :
                    step.color === "orange" ? "bg-accent-orange/10 border-accent-orange/15 text-accent-orange shadow-accent-orange/10" :
                    "bg-success-green/10 border-success-green/15 text-success-green shadow-success-green/10"
                  )}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F0F0FB]/30">{step.label}</span>
                </div>
                {i < 4 && (
                  <div className="flex-1 h-px bg-white/[0.08] mx-6 mt-[-30px] border-dashed border-b" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>


        <DataTable 
          columns={columns} 
          data={localEscrow} 
          isLoading={isLoading}
          searchKey="campaign"
          placeholder="Query escrow infrastructure by initiative identifier..."
        />

      </div>
    </DashboardShell>
  );
}
