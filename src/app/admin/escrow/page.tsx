"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge, StatCard, formatINR } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { LoadingState, ErrorState, MissingTableState } from "@/app/components/ui/shared-states";
import { 
  Lock, 
  Unlock, 
  Snowflake, 
  AlertCircle,
  ArrowRightLeft,
  ShieldCheck,
  Building,
  User as UserIcon,
  CheckCircle2,
  RefreshCcw,
  Filter,
  RefreshCw
} from "lucide-react";
import { Escrow } from "@/app/types";
import { cn } from "@/app/lib/utils";
import { escrowService } from "@/app/services/financialServices";
import { useToast } from "@/app/hooks/useToast";

export default function EscrowPage() {
  const { showToast } = useToast();
  const [localEscrow, setLocalEscrow] = useState<Escrow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [missingTableInfo, setMissingTableInfo] = useState<{ isMissing: boolean; name: string; sql: string }>({ isMissing: false, name: "", sql: "" });

  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    variant: "danger" | "info" | "warning" | "success";
    showInput: boolean;
    confirmText: string;
    actionType: "release" | "freeze" | "refund" | "";
  }>({ 
    title: "", 
    description: "", 
    variant: "danger",
    showInput: false,
    confirmText: "Confirm",
    actionType: ""
  });

  const loadEscrow = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setMissingTableInfo({ isMissing: false, name: "", sql: "" });
    try {
      const data = await escrowService.getEscrowList();
      if (data.isMissingTable && data.tableName && data.migrationSql) {
        setMissingTableInfo({ isMissing: true, name: data.tableName, sql: data.migrationSql });
      } else {
        setLocalEscrow(data.data);
      }
    } catch (error) {
      console.error("[EscrowPage] Failed to fetch escrow ledger:", error);
      setIsError(true);
      showToast("Infrastructure synchronization failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadEscrow();
  }, [loadEscrow]);

  const stats = useMemo(() => {
    let totalHeld = 0;
    let totalReleased = 0;
    let totalFrozen = 0;
    let totalDisputes = 0;

    localEscrow.forEach(e => {
      const amt = Number(e.amount.replace(/[^0-9.]/g, '')) || 0;
      if (e.status === "Held") totalHeld += amt;
      else if (e.status === "Released") totalReleased += amt;
      else if (e.status === "Frozen") totalFrozen += amt;
      else if (e.status === "Disputed") totalDisputes += 1;
    });

    return {
      held: formatINR(totalHeld),
      released: formatINR(totalReleased),
      frozen: formatINR(totalFrozen),
      disputes: totalDisputes.toString()
    };
  }, [localEscrow]);

  const filteredEscrow = useMemo(() => {
    return localEscrow.filter(e => {
      if (selectedStatus === "all") return true;
      return e.status.toLowerCase() === selectedStatus.toLowerCase();
    });
  }, [localEscrow, selectedStatus]);

  const handleAction = (item: Escrow, action: string) => {
    setSelectedEscrow(item);
    if (action === "release") {
      setModalConfig({
        title: "Release Escrow Funds",
        description: `Authorize instant transfer of ${item.amount} from escrow vault to creator settlement account for ${item.creator}.`,
        variant: "success",
        showInput: false,
        confirmText: "Authorize Release",
        actionType: "release"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "freeze") {
      setModalConfig({
        title: "Freeze Escrow Assets",
        description: `This will freeze ${item.amount} currently held in escrow. Please provide an administrative justification for this security protocol.`,
        variant: "warning",
        showInput: true,
        confirmText: "Freeze Assets",
        actionType: "freeze"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "refund") {
      setModalConfig({
        title: "Escrow Refund Protocol",
        description: `Return ${item.amount} held in escrow back to corporate brand ${item.brand}. This will terminate creator claim to these funds.`,
        variant: "danger",
        showInput: false,
        confirmText: "Process Refund",
        actionType: "refund"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedEscrow) return;
    setActionLoading(true);
    try {
      if (modalConfig.actionType === "release") {
        await escrowService.release(selectedEscrow.id);
        showToast(`Escrow released successfully for ${selectedEscrow.id.slice(0, 8)}`, "success");
      } else if (modalConfig.actionType === "freeze") {
        await escrowService.freeze(selectedEscrow.id, reason || "Administrative security freeze");
        showToast(`Escrow frozen for ${selectedEscrow.id.slice(0, 8)}`, "warning");
      } else if (modalConfig.actionType === "refund") {
        await escrowService.refund(selectedEscrow.id);
        showToast(`Escrow refunded successfully to brand for ${selectedEscrow.id.slice(0, 8)}`, "success");
      }
      setIsConfirmModalOpen(false);
      await loadEscrow();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Escrow directive failed";
      showToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<Escrow>[] = [
    {
      accessorKey: "id",
      header: "Infrastructure ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-foreground/20 font-mono tracking-tighter">{row.original.id.slice(0, 12)}...</span>,
    },
    {
      accessorKey: "campaign",
      header: "Campaign Initiative",
      cell: ({ row }) => (
        <div className="py-1 min-w-0">
          <p className="text-[15px] font-black text-foreground tracking-tight leading-none truncate">{row.original.campaign}</p>
          <div className="flex items-center space-x-3 mt-2 min-w-0">
             <div className="flex items-center space-x-1.5 text-[9px] text-foreground/30 uppercase font-black tracking-widest min-w-0">
                <Building className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{row.original.brand}</span>
             </div>
             <span className="text-foreground/10 flex-shrink-0">•</span>
             <div className="flex items-center space-x-1.5 text-[9px] text-foreground/30 uppercase font-black tracking-widest min-w-0">
                <UserIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{row.original.creator}</span>
             </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Fiscal Allocation",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span className="text-[15px] font-black text-foreground tracking-tighter">
            {formatINR(row.original.amount.replace(/[^0-9.]/g, ''))}
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
      cell: ({ row }) => <span className="text-[11px] font-black text-foreground/20 tracking-tighter uppercase">{row.original.releaseDate}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const escrowActions: ActionItem[] = [
          ...(row.original.status === 'Held' ? [
            {
              label: "Authorize Release",
              icon: CheckCircle2,
              onClick: () => handleAction(row.original, "release"),
              variant: "blue" as const,
              sectionLabel: "Escrow Directives"
            },
            {
              label: "Freeze Assets",
              icon: Snowflake,
              onClick: () => handleAction(row.original, "freeze"),
              variant: "orange" as const
            },
            {
              label: "Refund to Brand",
              icon: RefreshCcw,
              onClick: () => handleAction(row.original, "refund"),
              variant: "orange" as const,
              isSeparator: true
            }
          ] : [])
        ];

        return escrowActions.length > 0 ? <ActionDropdown actions={escrowActions} /> : <span className="text-xs text-foreground/20 italic">No actions</span>;
      },
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Escrow Infrastructure" 
          subtitle="Enterprise management of secured fiscal vectors and automated release protocols."
        >
          <button 
            onClick={() => loadEscrow()}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Vault</span>
          </button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <StatCard label="Aggregate Escrow" value={stats.held} icon={Lock} color="blue" />
          <StatCard label="Released Yield" value={stats.released} icon={Unlock} color="success" />
          <StatCard label="Frozen Assets" value={stats.frozen} icon={Snowflake} color="error" />
          <StatCard label="Incident Disputes" value={stats.disputes} icon={AlertCircle} color="orange" />
        </div>

        {/* Protocol Lifecycle Visualization */}
        <div className="bg-card-bg border border-border rounded-[40px] p-10 overflow-hidden relative shadow-premium mb-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
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
                    step.color === "blue" ? "bg-primary/10 border-primary/15 text-primary shadow-primary/10" :
                    step.color === "orange" ? "bg-accent-orange/10 border-accent-orange/15 text-accent-orange shadow-accent-orange/10" :
                    "bg-success-green/10 border-success-green/15 text-success-green shadow-success-green/10"
                  )}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">{step.label}</span>
                </div>
                {i < 4 && (
                  <div className="flex-1 h-px bg-surface-elevated mx-6 mt-[-30px] border-dashed border-b" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-card-bg border border-border mb-10 shadow-sm">
          <div className="flex items-center space-x-3 text-foreground/40 text-xs font-black uppercase tracking-widest">
            <Filter className="w-4 h-4 text-primary" />
            <span>Escrow Filters:</span>
          </div>

          <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
            <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-surface">All Records</option>
              <option value="Held" className="bg-surface">Held in Vault</option>
              <option value="Released" className="bg-surface">Released</option>
              <option value="Frozen" className="bg-surface">Frozen</option>
              <option value="Disputed" className="bg-surface">Disputed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Synchronizing Escrow Ledger..." />
        ) : missingTableInfo.isMissing ? (
          <MissingTableState tableName={missingTableInfo.name} migrationSql={missingTableInfo.sql} />
        ) : isError ? (
          <ErrorState onRetry={loadEscrow} />
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredEscrow} 
            searchKey="campaign"
            searchPlaceholder="Search escrows..."
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
    </DashboardShell>
  );
}
