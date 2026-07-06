"use client";

import React, { useMemo } from "react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";

type FinanceRecord = {
  id: string;
  transaction: string;
  brand: string;
  amount: string;
  status: string;
  date: string;
};

export default function FinancePage() {
  const columns = useMemo<ColumnDef<FinanceRecord>[]>(
    () => [
      {
        accessorKey: "transaction",
        header: "Transaction",
        cell: ({ row }) => (
          <span className="font-bold text-foreground font-mono">{row.original.transaction}</span>
        ),
      },
      {
        accessorKey: "brand",
        header: "Brand",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-bold text-emerald-600">{row.original.amount}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusPill
            label={row.original.status.toUpperCase()}
            variant={
              row.original.status === "completed"
                ? "success"
                : row.original.status === "pending"
                ? "warning"
                : "error"
            }
          />
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
      },
      {
        id: "actions",
        header: "Actions",
        cell: () => {
          return <ActionDropdown actions={[]} />;
        },
      },
    ],
    []
  );

  return (
    <ProtectedRoute permission="payments.read">
      <div className="space-y-5">
        <CommandHeader
          title="Finance & Payments"
          description="Manage platform revenue, payouts, and transactions."
        />

        <DataTable
          columns={columns}
          data={[]}
          searchKey="transaction"
          searchPlaceholder="Search transactions..."
          emptyTitle="No Financial Records"
          emptyDescription="Transactions will appear here once payments are processed."
        />
      </div>
    </ProtectedRoute>
  );
}
