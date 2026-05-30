"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge, StatCard, formatINR } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ActionDropdown, ActionItem } from "@/app/components/ui/action-dropdown";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { LoadingState, ErrorState, MissingTableState } from "@/app/components/ui/shared-states";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { useRouter } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { 
  CreditCard, 
  DollarSign,
  FileCheck,
  AlertCircle,
  FileText,
  RefreshCcw,
  CheckCircle2,
  Filter,
  RefreshCw
} from "lucide-react";
import { Payment } from "@/app/types";
import { paymentService } from "@/app/services/paymentService";
import { useToast } from "@/app/hooks/useToast";

type PaymentWithReview = Payment & {
  reviewed?: boolean;
};

type PaymentFilter = "paid" | "yield" | "risk";

export default function PaymentsPage() {
  const router = useRouter();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { showToast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [customFilter, setCustomFilter] = useState<PaymentFilter | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [activeMetricDetail, setActiveMetricDetail] = useState<{
    type: "gmv" | "yield" | "risk" | null;
    title: string;
    value: string;
    trend: string;
    description: string;
    ledgerSummary: string;
  } | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    variant: "danger" | "info" | "warning" | "success";
    showInput: boolean;
    confirmText: string;
    actionType: "refund" | "release" | "review" | "retry" | "";
  }>({ 
    title: "", 
    description: "", 
    variant: "danger",
    showInput: false,
    confirmText: "Confirm",
    actionType: ""
  });

  const [localPayments, setLocalPayments] = useState<PaymentWithReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [missingTableInfo, setMissingTableInfo] = useState<{ isMissing: boolean; name: string; sql: string }>({ isMissing: false, name: "", sql: "" });

  const loadPayments = useCallback(async (isManual = false) => {
    setIsLoading(true);
    setIsError(false);
    setMissingTableInfo({ isMissing: false, name: "", sql: "" });
    try {
      const data = await paymentService.getPayments();
      if (data.isMissingTable && data.tableName && data.migrationSql) {
        setMissingTableInfo({ isMissing: true, name: data.tableName, sql: data.migrationSql });
      } else {
        setLocalPayments(data.data);
        if (isManual) {
          showToast("Fiscal ledger synchronized successfully with database.", "success");
        }
      }
    } catch (err) {
      setIsError(true);
      const message = err instanceof Error ? err.message : "Unable to sync fiscal ledger from the global infrastructure.";
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPayments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPayments]);

  const stats = useMemo(() => {
    let totalGmv = 0;
    let totalYield = 0;
    let totalEscrow = 0;
    let totalRisk = 0;

    localPayments.forEach(p => {
      const amt = Number(p.amount.replace(/[^0-9.]/g, '')) || 0;
      const comm = Number(p.commission?.replace(/[^0-9.]/g, '')) || 0;
      if (["paid", "success"].includes(p.status.toLowerCase())) {
        totalGmv += amt;
      }
      totalYield += comm;
      if (p.status.toLowerCase() === "pending") {
        totalEscrow += amt;
      }
      if (["failed", "refunded", "disputed", "cancelled"].includes(p.status.toLowerCase())) {
        totalRisk += amt;
      }
    });

    return {
      gmv: formatINR(totalGmv),
      yield: formatINR(totalYield),
      escrow: formatINR(totalEscrow),
      risk: formatINR(totalRisk),
    };
  }, [localPayments]);

  const filteredPayments = useMemo(() => {
    return localPayments.filter(p => {
      if (customFilter === "risk") {
        return ["failed", "refunded", "disputed"].includes(p.status.toLowerCase());
      }
      if (customFilter === "paid") {
        return ["paid", "success"].includes(p.status.toLowerCase());
      }
      if (customFilter === "yield") {
        return Number(p.commission?.replace(/[^0-9.]/g, '')) > 0;
      }
      if (selectedStatus === "all") return true;
      return p.status.toLowerCase() === selectedStatus.toLowerCase();
    });
  }, [localPayments, selectedStatus, customFilter]);

  const handleMetricCardClick = useCallback((metricType: "gmv" | "yield" | "escrow" | "risk") => {
    if (metricType === "escrow") {
      router.push("/admin/escrow?status=held", { scroll: false });
      return;
    }

    if (metricType === "gmv") {
      setCustomFilter("paid");
      setSelectedStatus("paid");
      
      const paidAmt = localPayments
        .filter(p => ["paid", "success"].includes(p.status.toLowerCase()))
        .reduce((sum, p) => sum + (Number(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);

      setActiveMetricDetail({
        type: "gmv",
        title: "Aggregate GMV Details",
        value: formatINR(paidAmt),
        trend: "+15.4%",
        description: "Gross Merchandise Value represents the total volume of successfully paid creator-brand matches processed on the platform.",
        ledgerSummary: `Calculated from ${localPayments.filter(p => ["paid", "success"].includes(p.status.toLowerCase())).length} paid transactions. Unsettled, failed, or pending transactions are excluded from GMV.`
      });
    } else if (metricType === "yield") {
      setCustomFilter("yield");
      setSelectedStatus("all");

      const yieldAmt = localPayments.reduce((sum, p) => {
        const comm = Number(p.commission?.replace(/[^0-9.]/g, '')) || 0;
        return sum + comm;
      }, 0);

      const hasFee = localPayments.some(p => Number(p.commission?.replace(/[^0-9.]/g, '')) > 0);

      setActiveMetricDetail({
        type: "yield",
        title: "Platform Yield Details",
        value: formatINR(yieldAmt),
        trend: "+12.1%",
        description: "Platform Yield represents the platform commission captured from creator campaigns and transactions.",
        ledgerSummary: hasFee 
          ? `Calculated from platform fees on ${localPayments.length} campaigns. Configuration active.` 
          : "Platform yield configuration missing or no fees captured yet."
      });
    } else if (metricType === "risk") {
      setCustomFilter("risk");
      setSelectedStatus("failed");

      const riskPayments = localPayments.filter(p => ["failed", "refunded", "disputed"].includes(p.status.toLowerCase()));
      const riskAmt = riskPayments.reduce((sum, p) => sum + (Number(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);

      setActiveMetricDetail({
        type: "risk",
        title: "Operational Risk Details",
        value: formatINR(riskAmt),
        trend: "-4.5%",
        description: "Operational Risk represents the volume of transactions flagged as failed, disputed, refunded, or cancelled.",
        ledgerSummary: `Calculated from ${riskPayments.length} failed/disputed/refunded transactions. High alert indicates potential reconciliation issues.`
      });
    }

    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [localPayments, router]);

  const handleAction = (payment: Payment, action: string) => {
    setSelectedPayment(payment);
    if (action === "receipt") {
      try {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(payment, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `payment_ledger_${payment.id.slice(0, 8)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast(`Exported verified ledger receipt for TXN: ${payment.id.slice(0, 8)}`, "success");
      } catch {
        showToast("Failed to export receipt", "error");
      }
    } else if (action === "refund") {
      setModalConfig({
        title: "Transaction Refund Protocol",
        description: `This will reverse the fiscal allocation of ${payment.amount} for transaction ID ${payment.id.slice(0, 8)}. This action is irreversible.`,
        variant: "danger",
        showInput: false,
        confirmText: "Process Full Refund",
        actionType: "refund"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "release") {
      setModalConfig({
        title: "Escrow Release Protocol",
        description: `Authorize payout of ${payment.amount} to creator ${payment.creator}. This transfers funds from platform escrow directly to creator settlement account.`,
        variant: "success",
        showInput: false,
        confirmText: "Release Funds",
        actionType: "release"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "review") {
      setModalConfig({
        title: "Audit Review Protocol",
        description: `This will mark the transaction ${payment.id.slice(0, 8)} as administratively reviewed and cleared for ledger accounting.`,
        variant: "info",
        showInput: false,
        confirmText: "Mark Reviewed",
        actionType: "review"
      });
      setIsConfirmModalOpen(true);
    } else if (action === "retry") {
      setModalConfig({
        title: "Payout Retry Protocol",
        description: `Initiate payout retry sequence for transaction ${payment.id.slice(0, 8)} of value ${payment.amount}.`,
        variant: "warning",
        showInput: false,
        confirmText: "Retry Payout",
        actionType: "retry"
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      if (modalConfig.actionType === "refund") {
        await paymentService.refundPayment(selectedPayment.id);
        showToast(`Refund processed successfully for ${selectedPayment.id.slice(0, 8)}`, "success");
      } else if (modalConfig.actionType === "release") {
        await paymentService.releasePayout(selectedPayment.id);
        showToast(`Funds released successfully for TXN ${selectedPayment.id.slice(0, 8)}`, "success");
      } else if (modalConfig.actionType === "review") {
        await paymentService.updatePaymentReview(selectedPayment.id, true);
        showToast(`Transaction marked as reviewed.`, "success");
      } else if (modalConfig.actionType === "retry") {
        await paymentService.retryPayout(selectedPayment.id);
        showToast(`Payout retry sequence initialized.`, "success");
      }
      setIsConfirmModalOpen(false);
      await loadPayments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Administrative directive failed";
      showToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<PaymentWithReview>[] = [
    {
      accessorKey: "id",
      header: "Infrastructure ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-foreground/20 font-mono tracking-tighter">{row.original.id.slice(0, 12)}...</span>,
    },
    {
      accessorKey: "brand",
      header: "Corporate Entity",
      cell: ({ row }) => (
        <div>
          <p className="text-[15px] font-black text-foreground tracking-tight">{row.original.brand || "Unknown payer"}</p>
          {row.original.brand_profile?.email && (
            <p className="text-[11px] text-foreground/40">{row.original.brand_profile.email}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "creator",
      header: "Creator Network",
      cell: ({ row }) => (
        <div>
          <span className="text-[11px] font-black text-foreground uppercase tracking-[0.2em]">{row.original.creator || "Unknown payee"}</span>
          {row.original.creator_profile?.email && (
            <p className="text-[10px] text-foreground/40 font-mono">{row.original.creator_profile.email}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Transaction Value",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span className="text-[15px] font-black text-foreground tracking-tighter">{formatINR(row.original.amount ? row.original.amount.replace(/[^0-9.]/g, '') : '0')}</span>
        </div>
      ),
    },
    {
      accessorKey: "commission",
      header: "Platform Yield",
      cell: ({ row }) => (
        <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/15 tracking-widest uppercase shadow-sm">
          {formatINR(row.original.commission ? row.original.commission.replace(/[^0-9.]/g, '') : '0')}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Operational State",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status || "pending"} 
          variant={
            row.original.status === "paid" ? "success" : 
            row.original.status === "pending" ? "warning" : 
            row.original.status === "failed" ? "error" : "default"
          } 
        />
      ),
    },
    {
      accessorKey: "date",
      header: "Temporal Origin",
      cell: ({ row }) => <span className="text-[11px] font-black text-foreground/20 tracking-tighter">{row.original.date}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const paymentActions: ActionItem[] = [
          {
            label: "View Details",
            icon: FileText,
            onClick: () => setViewingPayment(row.original),
            sectionLabel: "Fiscal Directives"
          },
          {
            label: "Export Verified Receipt",
            icon: FileText,
            onClick: () => handleAction(row.original, "receipt"),
          },
          ...(!row.original.reviewed ? [{
            label: "Mark as Reviewed",
            icon: CheckCircle2,
            onClick: () => handleAction(row.original, "review"),
            variant: "blue" as const
          }] : []),
          ...((row.original.status as string) === 'pending' ? [{
            label: "Release Payout",
            icon: CheckCircle2,
            onClick: () => handleAction(row.original, "release"),
            variant: "blue" as const
          }] : []),
          ...((row.original.status as string) === 'paid' ? [{
            label: "Initiate Refund Protocol",
            icon: RefreshCcw,
            onClick: () => handleAction(row.original, "refund"),
            variant: "orange" as const
          }] : []),
          ...(['failed', 'processing'].includes(row.original.status as string) ? [{
            label: "Retry Payout",
            icon: RefreshCcw,
            onClick: () => handleAction(row.original, "retry"),
            variant: "orange" as const
          }] : [])
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
          <button 
            onClick={() => loadPayments(true)}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span>{isLoading ? "Syncing..." : "Sync Ledger"}</span>
          </button>
        </PageHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-10">
          <StatCard label="Aggregate GMV" value={stats.gmv} trend="+15.4%" up icon={DollarSign} color="blue" onClick={() => handleMetricCardClick("gmv")} />
          <StatCard label="Platform Yield" value={stats.yield} trend="+12.1%" up icon={FileCheck} color="success" onClick={() => handleMetricCardClick("yield")} />
          <StatCard label="Escrow Liquidity" value={stats.escrow} trend="+8.2%" up icon={CreditCard} color="orange" onClick={() => handleMetricCardClick("escrow")} />
          <StatCard label="Operational Risk" value={stats.risk} trend="-4.5%" up={false} icon={AlertCircle} color="error" onClick={() => handleMetricCardClick("risk")} />
        </div>

        <div ref={tableRef} className="scroll-mt-12">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-card-bg border border-border mb-10 shadow-sm">
            <div className="flex items-center space-x-3 text-foreground/40 text-xs font-black uppercase tracking-widest">
              <Filter className="w-4 h-4 text-primary" />
              <span>Transaction Filters:</span>
            </div>

            <div className="flex items-center space-x-2 bg-surface border border-border rounded-2xl px-4 py-2">
              <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCustomFilter(null);
                }}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-surface">All Transactions</option>
                <option value="pending" className="bg-surface">Pending</option>
                <option value="paid" className="bg-surface">Paid</option>
                <option value="failed" className="bg-surface">Failed</option>
                <option value="refunded" className="bg-surface">Refunded</option>
                <option value="cancelled" className="bg-surface">Cancelled</option>
                <option value="processing" className="bg-surface">Processing</option>
                <option value="disputed" className="bg-surface">Disputed</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Synchronizing Fiscal Ledger..." />
          ) : missingTableInfo.isMissing ? (
            <MissingTableState tableName={missingTableInfo.name} migrationSql={missingTableInfo.sql} />
          ) : isError ? (
            <ErrorState onRetry={() => loadPayments(true)} />
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center bg-card-bg rounded-[32px] border border-border space-y-4">
              <CreditCard className="w-12 h-12 text-primary/40 mx-auto" />
              <h3 className="text-lg font-black text-foreground">No Fiscal Allocations Detected</h3>
              <p className="text-xs text-foreground/40 max-w-md mx-auto">No transaction records matching the active filter criteria were found in the production database.</p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredPayments} 
              searchKey="brand"
              placeholder="Query fiscal infrastructure by corporate entity..."
            />
          )}
        </div>
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

      {activeMetricDetail && (
        <DetailDrawer
          isOpen={!!activeMetricDetail}
          onClose={() => setActiveMetricDetail(null)}
          title={activeMetricDetail.title}
          subtitle="System Performance Metric"
        >
          <div className="space-y-8 text-foreground">
            <div className="p-6 rounded-[24px] bg-surface border border-border">
              <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">CURRENT VALUATION</span>
              <div className="flex items-baseline space-x-3 mt-2">
                <span className="text-4xl font-black text-foreground tracking-tighter">{activeMetricDetail.value}</span>
                <span className="text-xs font-bold text-success-green bg-success-green/10 border border-success-green/15 px-2.5 py-0.5 rounded-full">{activeMetricDetail.trend}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">METRIC DESCRIPTION</span>
              <p className="text-sm text-foreground/60 leading-relaxed font-semibold">{activeMetricDetail.description}</p>
            </div>

            <div className="p-6 rounded-[24px] bg-primary/5 border border-primary/10 space-y-2">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">LEDGER SUMMARY</span>
              <p className="text-xs text-foreground/60 leading-relaxed font-semibold">{activeMetricDetail.ledgerSummary}</p>
            </div>
          </div>
        </DetailDrawer>
      )}

      {viewingPayment && (
        <DetailDrawer
          isOpen={!!viewingPayment}
          onClose={() => setViewingPayment(null)}
          title="Transaction Details"
          subtitle={`TXN: ${viewingPayment.id.slice(0, 8)}`}
        >
          <div className="space-y-8 text-foreground">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface border border-border">
                <span className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">OPERATIONAL STATE</span>
                <div className="mt-1">
                  <StatusBadge 
                    status={viewingPayment.status || "pending"} 
                    variant={
                      viewingPayment.status === "paid" ? "success" : 
                      viewingPayment.status === "pending" ? "warning" : 
                      viewingPayment.status === "failed" ? "error" : "default"
                    } 
                  />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-border">
                <span className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">TRANSACTION VALUE</span>
                <p className="text-xl font-black text-foreground mt-1">{formatINR(viewingPayment.amount ? viewingPayment.amount.replace(/[^0-9.]/g, '') : '0')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">RECONCILIATION PARAMS</span>
              <div className="p-6 rounded-[24px] bg-surface-elevated border border-border space-y-4 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-foreground/40">Corporate Entity:</span>
                  <span className="text-foreground">{viewingPayment.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/40">Creator Network:</span>
                  <span className="text-foreground">{viewingPayment.creator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/40">Platform Yield:</span>
                  <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/15 text-[10px] font-black">{formatINR(viewingPayment.commission ? viewingPayment.commission.replace(/[^0-9.]/g, '') : '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/40">Temporal Origin:</span>
                  <span className="text-foreground">{viewingPayment.date}</span>
                </div>
                {viewingPayment.payer_profile?.email && (
                  <div className="flex justify-between">
                    <span className="text-foreground/40">Payer Email:</span>
                    <span className="text-foreground font-mono text-[11px]">{viewingPayment.payer_profile.email}</span>
                  </div>
                )}
                {viewingPayment.payee_profile?.email && (
                  <div className="flex justify-between">
                    <span className="text-foreground/40">Payee Email:</span>
                    <span className="text-foreground font-mono text-[11px]">{viewingPayment.payee_profile.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 rounded-[24px] bg-surface border border-border space-y-2">
              <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">METADATA VECTORS</span>
              <pre className="text-[10px] font-mono text-foreground/50 overflow-x-auto whitespace-pre bg-background/40 p-4 rounded-xl">
                {JSON.stringify({
                  id: viewingPayment.id,
                  campaign: viewingPayment.campaign,
                  currency: "INR",
                  payment_method: "UPI / Card",
                  reference_id: `REF-${viewingPayment.id.slice(0, 8).toUpperCase()}`,
                }, null, 2)}
              </pre>
            </div>
          </div>
        </DetailDrawer>
      )}
    </DashboardShell>
  );
}
