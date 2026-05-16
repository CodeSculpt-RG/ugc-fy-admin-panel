"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge, StatCard } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { 
  CreditCard, 
  Download,
  DollarSign,
  FileCheck,
  AlertCircle,
  FileText,
  RefreshCcw,
  Flag
} from "lucide-react";
import { Payment } from "@/app/types";

import { paymentService } from "@/app/services/financialServices";
import { useToast } from "@/app/hooks/useToast";


export default function PaymentsPage() {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [modalConfig, setModalConfig] = useState({ 
    title: "", 
    description: "", 
    variant: "danger" as "danger" | "info" | "warning" | "success",
    showInput: false,
    confirmText: "Confirm",
    actionType: "" as "refund" | "flag"
  });

  const [localPayments, setLocalPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadPayments = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await paymentService.getPayments();
      setLocalPayments(data);
    } catch (err) {
      console.error("[PaymentsPage] Fiscal synchronization failure:", err);
      setIsError(true);
      showToast("Unable to sync fiscal ledger from the global infrastructure.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    const synchronize = async () => {
      await loadPayments();
    };
    synchronize();
  }, [loadPayments]);

  const handleAction = (payment: Payment, action: string) => {
    setSelectedPayment(payment);
    if (action === "receipt") {
      showToast(`Exporting receipt for ${payment.id}`, "info");
    } else if (action === "refund") {
      setModalConfig({
        title: "Transaction Refund Protocol",
        description: `This will reverse the fiscal allocation of ${payment.amount} for infrastructure ID ${payment.id}. This action is irreversible.`,
        variant: "danger",
        showInput: true,
        confirmText: "Process Refund",
        actionType: "refund"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "flag") {
      setModalConfig({
        title: "Forensic Investigation Escalation",
        description: `This will escalate transaction ${payment.id} to the security audit unit for a full forensic lifecycle review.`,
        variant: "warning",
        showInput: true,
        confirmText: "Flag Transaction",
        actionType: "flag"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPayment) return;
    try {
      if (modalConfig.actionType === "refund") {
        showToast(`Refund processed for ${selectedPayment.id}`, "success");
      } else if (modalConfig.actionType === "flag") {
        showToast(`Transaction ${selectedPayment.id} flagged for review`, "warning");
      }
      setIsConfirmModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Administrative directive failed";
      showToast(message, "error");
    }
  };


  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "id",
      header: "Infrastructure ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-[#F0F0FB]/20 font-mono tracking-tighter">{row.original.id}</span>,

    },
    {
      accessorKey: "brand",
      header: "Corporate Entity",
      cell: ({ row }) => <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight">{row.original.brand}</p>,

    },
    {
      accessorKey: "creator",
      header: "Creator Network",
      cell: ({ row }) => <span className="text-[11px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.2em]">{row.original.creator}</span>,

    },
    {
      accessorKey: "amount",
      header: "Transaction Value",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-black text-primary-blue opacity-40">$</span>
          <span className="text-[15px] font-black text-[#F0F0FB] tracking-tighter">{row.original.amount.replace('$', '')}</span>
        </div>

      ),
    },
    {
      accessorKey: "commission",
      header: "Platform Yield",
      cell: ({ row }) => (
        <span className="text-[11px] font-black text-primary-blue bg-primary-blue/10 px-3 py-1.5 rounded-xl border border-primary-blue/15 tracking-widest uppercase shadow-sm">
          {row.original.commission}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Operational State",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          variant={
            row.original.status === "Paid" ? "success" : 
            row.original.status === "Pending" ? "warning" : 
            row.original.status === "Failed" ? "error" : "default"
          } 
        />
      ),
    },
    {
      accessorKey: "date",
      header: "Temporal Origin",
      cell: ({ row }) => <span className="text-[11px] font-black text-[#F0F0FB]/20 tracking-tighter">{row.original.date}</span>,

    },
    {
      id: "actions",
      cell: ({ row }) => {
        const paymentActions: ActionItem[] = [
          {
            label: "Export Verified Receipt",
            icon: FileText,
            onClick: () => handleAction(row.original, "receipt"),
            sectionLabel: "Fiscal Directives"
          },
          {
            label: "Initiate Refund Protocol",
            icon: RefreshCcw,
            onClick: () => handleAction(row.original, "refund"),
            variant: "orange"
          },
          {
            label: "Escalate for Forensic Review",
            icon: Flag,
            onClick: () => handleAction(row.original, "flag"),
            variant: "orange",
            isSeparator: true
          }
        ];

        return <ActionDropdown actions={paymentActions} />;
      },
    },
  ];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Fiscal Infrastructure" 
          subtitle="Enterprise management of platform liquidity, creator payouts, and corporate reconciliation vectors."
        >
          <div className="flex items-center space-x-4">
            <button className="h-12 px-6 rounded-2xl bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center shadow-sm">
              <Download className="w-4 h-4 mr-3" />
              Sync Ledger
            </button>
            <button className="h-12 px-8 rounded-2xl bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95">
              Authorize Reconciliation
            </button>
          </div>

        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard label="Aggregate GMV" value="$428,500" trend="+15.4%" up icon={DollarSign} color="blue" />
          <StatCard label="Platform Yield" value="$64,275" trend="+12.1%" up icon={FileCheck} color="success" />
          <StatCard label="Escrow Liquidity" value="$22,400" trend="+8.2%" up icon={CreditCard} color="orange" />
          <StatCard label="Operational Risk" value="$1,250" trend="-4.5%" up={false} icon={AlertCircle} color="error" />
        </div>

        {isError ? (
          <div className="p-20 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto text-error">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-white">Fiscal Ledger Error</p>
              <p className="text-sm text-white/30 max-w-md mx-auto italic">Inability to establish secure handshake with the financial infrastructure.</p>
            </div>
            <button 
              onClick={() => loadPayments()}
              className="px-8 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Retry Handshake
            </button>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={localPayments} 
            isLoading={isLoading}
            searchKey="id"
            placeholder="Query fiscal infrastructure by TXN_ID or entity identifier..."
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
      />
    </DashboardShell>
  );
}
