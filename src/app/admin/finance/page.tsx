"use client";

import React from "react";
import { AlertCircle, Banknote, CircleDollarSign, ReceiptText } from "lucide-react";
import { PageHeader, StatCard } from "@/app/components/ui/core";
import { EmptyState } from "@/app/components/ui/shared-states";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";

export default function FinancePage() {
  return (
    <ProtectedRoute permission="payments.read">
      <div className="section-spacing">
        <PageHeader
          title="Finance"
          subtitle="Monitor campaign payments, payouts, invoices, and platform revenue."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Collected" value="₹0" icon={CircleDollarSign} color="blue" />
          <StatCard label="Pending Payouts" value="₹0" icon={Banknote} color="orange" delay={0.05} />
          <StatCard label="Platform Fees" value="₹0" icon={ReceiptText} color="success" delay={0.1} />
          <StatCard label="Failed Payments" value="0" icon={AlertCircle} color="error" delay={0.15} />
        </div>

        <EmptyState
          title="Finance Workspace Is Ready"
          description="Payment and payout data is not fully available yet. The dashboard remains operational while finance tables are configured."
          icon={<CircleDollarSign className="w-12 h-12 text-primary" />}
        />
      </div>
    </ProtectedRoute>
  );
}
