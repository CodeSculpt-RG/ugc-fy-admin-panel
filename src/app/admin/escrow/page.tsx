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
import { Button } from "@/app/components/ui/button";
import { Escrow } from "@/app/types";
import { cn } from "@/app/lib/utils";

const mockEscrow: Escrow[] = [
  { id: "ESC-101", campaign: "Summer Tech Blast", brand: "TechNova", creator: "Alex Rivera", amount: "$12,000", status: "Held", releaseDate: "2026-06-15" },
  { id: "ESC-102", campaign: "Glow Skin Routine", brand: "Luxe Beauty", creator: "Sarah Chen", amount: "$8,500", status: "Held", releaseDate: "2026-06-20" },
  { id: "ESC-103", campaign: "Fitness App Launch", brand: "FitStep", creator: "Marcus Thorne", amount: "$15,000", status: "Released", releaseDate: "2026-05-12" },
  { id: "ESC-104", campaign: "Cyber Gaming Setup", brand: "Razer Edge", creator: "David Kim", amount: "$25,000", status: "Frozen", releaseDate: "2026-05-10" },
  { id: "ESC-105", campaign: "Energy Drink Promo", brand: "PureFuel", creator: "Elena Gomez", amount: "$5,000", status: "Disputed", releaseDate: "2026-07-01" },
];

export default function EscrowPage() {
  const columns: ColumnDef<Escrow>[] = [
    {
      accessorKey: "id",
      header: "Escrow ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-soft-white/60 font-mono tracking-tighter">{row.original.id}</span>,
    },
    {
      accessorKey: "campaign",
      header: "Campaign",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-bold text-soft-white">{row.original.campaign}</p>
          <div className="flex items-center space-x-2 mt-0.5">
             <div className="flex items-center space-x-1 text-[10px] text-soft-white/30 uppercase font-bold">
                <Building className="w-3 h-3" />
                <span>{row.original.brand}</span>
             </div>
             <span className="text-soft-white/20">•</span>
             <div className="flex items-center space-x-1 text-[10px] text-soft-white/30 uppercase font-bold">
                <UserIcon className="w-3 h-3" />
                <span>{row.original.creator}</span>
             </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="text-sm font-bold text-soft-white">{row.original.amount}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
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
      header: "Release Date",
      cell: ({ row }) => <span className="text-xs text-soft-white/30">{row.original.releaseDate}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right flex items-center justify-end space-x-2">
          {row.original.status === "Held" && (
            <Button size="sm" className="bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white h-8 px-3 text-[10px] font-bold uppercase">
              Release
            </Button>
          )}
          {row.original.status === "Held" && (
            <Button size="sm" className="bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white h-8 px-3 text-[10px] font-bold uppercase">
              Freeze
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <PageHeader 
        title="Escrow Management" 
        subtitle="Manage secure funds held for campaign completions and dispute resolutions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Funds in Escrow" value="$1.2M" icon={Lock} color="blue" />
        <StatCard label="Scheduled for Release" value="$42,500" icon={Unlock} color="success" />
        <StatCard label="Frozen Funds" value="$15,000" icon={Snowflake} color="error" />
        <StatCard label="Pending Disputes" value="8" icon={AlertCircle} color="orange" />
      </div>

      {/* Escrow Flow Visualization */}
      <div className="bg-dark-surface/50 border border-white/5 rounded-[32px] p-8 mb-10 overflow-hidden relative">
        <div className="flex items-center justify-between relative z-10 max-w-4xl mx-auto">
          {[
            { label: "Brand Payment", icon: Building, color: "blue" },
            { label: "Escrow Hold", icon: Lock, color: "orange" },
            { label: "Campaign Check", icon: ShieldCheck, color: "orange" },
            { label: "Admin Review", icon: AlertCircle, color: "orange" },
            { label: "Creator Payout", icon: ArrowRightLeft, color: "success" },
          ].map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center space-y-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border",
                  step.color === "blue" ? "bg-primary-blue/10 border-primary-blue/20 text-primary-blue" :
                  step.color === "orange" ? "bg-accent-orange/10 border-accent-orange/20 text-accent-orange" :
                  "bg-success/10 border-success/20 text-success"
                )}>
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-soft-white/40">{step.label}</span>
              </div>
              {i < 4 && (
                <div className="flex-1 h-[2px] bg-white/5 mx-4 mt-[-20px]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={mockEscrow} 
        searchKey="campaign"
        placeholder="Search by campaign name..."
      />
    </DashboardShell>
  );
}
