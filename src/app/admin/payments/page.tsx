"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge, StatCard } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download,
  Filter,
  DollarSign,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Payment } from "@/app/types";

const mockPayments: Payment[] = [
  { id: "TXN-84920", brand: "TechNova", creator: "Alex Rivera", campaign: "Summer Tech Blast", amount: "$1,200", commission: "$180", status: "Paid", date: "2026-05-12" },
  { id: "TXN-84921", brand: "Luxe Beauty", creator: "Sarah Chen", campaign: "Glow Skin Routine", amount: "$850", commission: "$127", status: "Pending", date: "2026-05-12" },
  { id: "TXN-84922", brand: "FitStep", creator: "Marcus Thorne", campaign: "Fitness App Launch", amount: "$2,500", commission: "$375", status: "Paid", date: "2026-05-11" },
  { id: "TXN-84923", brand: "PureFuel", creator: "Elena Gomez", campaign: "Energy Drink Promo", amount: "$500", commission: "$75", status: "Failed", date: "2026-05-10" },
  { id: "TXN-84924", brand: "Razer Edge", creator: "David Kim", campaign: "Cyber Gaming Setup", amount: "$3,200", commission: "$480", status: "Refunded", date: "2026-05-09" },
];

export default function PaymentsPage() {
  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "id",
      header: "TXN ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-soft-white/60 font-mono tracking-tighter">{row.original.id}</span>,
    },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ row }) => <span className="text-sm font-bold text-soft-white">{row.original.brand}</span>,
    },
    {
      accessorKey: "creator",
      header: "Creator",
      cell: ({ row }) => <span className="text-xs text-soft-white/60">{row.original.creator}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="text-sm font-bold text-soft-white">{row.original.amount}</span>,
    },
    {
      accessorKey: "commission",
      header: "Platform Fee",
      cell: ({ row }) => <span className="text-xs font-bold text-primary-blue">{row.original.commission}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
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
      header: "Date",
      cell: ({ row }) => <span className="text-xs text-soft-white/30">{row.original.date}</span>,
    },
    {
      id: "actions",
      cell: () => (
        <div className="text-right">
          <Button variant="ghost" className="h-8 px-2 text-xs font-bold text-primary-blue hover:bg-primary-blue/10">
            Receipt
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <PageHeader 
        title="Financial Operations" 
        subtitle="Manage platform revenue, creator payouts, and brand transactions."
      >
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-white/5 border-white/10 text-soft-white rounded-xl h-12 px-5">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 px-6 font-bold">
            Reconcile Payments
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Revenue" value="$428,500" trend="+15%" up icon={DollarSign} color="blue" />
        <StatCard label="Platform Commission" value="$64,275" trend="+12%" up icon={FileCheck} color="success" />
        <StatCard label="Pending Payouts" value="$22,400" trend="+8%" up icon={CreditCard} color="orange" />
        <StatCard label="Failed Payments" value="$1,250" trend="-4%" up={false} icon={AlertCircle} color="error" />
      </div>

      <DataTable 
        columns={columns} 
        data={mockPayments} 
        searchKey="id"
        placeholder="Search by transaction ID..."
      />
    </DashboardShell>
  );
}
