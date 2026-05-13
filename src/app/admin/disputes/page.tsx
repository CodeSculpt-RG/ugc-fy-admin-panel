"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Scale, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { Dispute } from "@/app/types";

const mockDisputes: Dispute[] = [
  { id: "DSP-501", creator: "Alex Rivera", brand: "TechNova", campaign: "Summer Tech Blast", type: "Payment", priority: "High", status: "In Review", openedDate: "2026-05-10" },
  { id: "DSP-502", creator: "Sarah Chen", brand: "Luxe Beauty", campaign: "Glow Skin Routine", type: "Content", priority: "Medium", status: "Open", openedDate: "2026-05-12" },
  { id: "DSP-503", creator: "Marcus Thorne", brand: "FitStep", campaign: "Fitness App Launch", type: "Deadline", priority: "Low", status: "Resolved", openedDate: "2026-05-05" },
  { id: "DSP-504", creator: "Elena Gomez", brand: "PureFuel", campaign: "Energy Drink Promo", type: "Refund", priority: "Critical", status: "Open", openedDate: "2026-05-11" },
  { id: "DSP-505", creator: "David Kim", brand: "Razer Edge", campaign: "Cyber Gaming Setup", type: "Fraud", priority: "Critical", status: "In Review", openedDate: "2026-05-08" },
];

export default function DisputesPage() {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const columns: ColumnDef<Dispute>[] = [
    {
      accessorKey: "id",
      header: "Dispute ID",
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-soft-white/60 font-mono tracking-tighter">{row.original.id}</span>,
    },
    {
      accessorKey: "type",
      header: "Category",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <AlertTriangle className={cn(
            "w-3.5 h-3.5",
            row.original.type === "Fraud" ? "text-error" : "text-warning"
          )} />
          <span className="text-xs font-bold text-soft-white">{row.original.type}</span>
        </div>
      ),
    },
    {
      accessorKey: "campaign",
      header: "Context",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-soft-white">{row.original.campaign}</p>
          <p className="text-[10px] text-soft-white/30 uppercase font-bold">{row.original.brand} vs {row.original.creator}</p>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <span className={cn(
          "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
          row.original.priority === "Critical" ? "bg-error/10 text-error" : 
          row.original.priority === "High" ? "bg-warning/10 text-warning" : 
          "bg-white/5 text-soft-white/40"
        )}>
          {row.original.priority}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
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
      header: "Opened",
      cell: ({ row }) => <span className="text-xs text-soft-white/30">{row.original.openedDate}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-soft-white/40 hover:text-soft-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-dark-surface border-white/10 text-soft-white">
              <DropdownMenuItem onClick={() => { setSelectedDispute(row.original); setIsDrawerOpen(true); }} className="cursor-pointer focus:bg-white/5">
                <Scale className="mr-2 h-4 w-4" /> Review Evidence
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                <MessageSquare className="mr-2 h-4 w-4" /> Open Chat
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5 text-success">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve Case
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <PageHeader 
        title="Dispute Resolution Center" 
        subtitle="Neutral mediation between brands and creators for contract fulfillment and payments."
      />

      <DataTable 
        columns={columns} 
        data={mockDisputes} 
        searchKey="id"
        placeholder="Search disputes..."
      />

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedDispute?.id || "Dispute Details"}
        subtitle={`${selectedDispute?.type} Issue • ${selectedDispute?.campaign}`}
      >
        {selectedDispute && (
          <div className="space-y-8">
            {/* Timeline */}
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Case Timeline</h4>
               <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                  <div className="relative">
                     <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-blue ring-4 ring-black" />
                     <p className="text-xs font-bold text-soft-white">Dispute Opened</p>
                     <p className="text-[10px] text-soft-white/40 mt-1">{selectedDispute.openedDate} • Reason: Payment not received after content approval</p>
                  </div>
                  <div className="relative">
                     <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-warning ring-4 ring-black" />
                     <p className="text-xs font-bold text-soft-white">Admin Assigned</p>
                     <p className="text-[10px] text-soft-white/40 mt-1">2h ago • Case is being reviewed by Finance Admin</p>
                  </div>
               </div>
            </div>

            {/* Evidence Section */}
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Evidence Locker</h4>
               <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: "Campaign_Agreement.pdf", size: "1.2 MB" },
                    { name: "Approval_Screenshot.png", size: "840 KB" },
                    { name: "Chat_Log_Export.csv", size: "45 KB" }
                  ].map((file) => (
                    <div key={file.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all cursor-pointer">
                       <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-primary-blue" />
                          <div>
                             <p className="text-xs font-bold text-soft-white">{file.name}</p>
                             <p className="text-[10px] text-soft-white/30 uppercase font-bold">{file.size}</p>
                          </div>
                       </div>
                       <ExternalLink className="w-3.5 h-3.5 text-soft-white/20" />
                    </div>
                  ))}
               </div>
            </div>

            {/* Resolution Actions */}
            <div className="pt-8 border-t border-white/5 space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Final Resolution</h4>
               <div className="grid grid-cols-1 gap-3">
                  <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white font-bold rounded-xl h-12">
                    Release Payout to Creator
                  </Button>
                  <Button variant="outline" className="border-error/20 text-error hover:bg-error/10 font-bold rounded-xl h-12">
                    Refund Full Amount to Brand
                  </Button>
                  <Button variant="outline" className="border-white/10 text-soft-white font-bold rounded-xl h-12">
                    Request More Information
                  </Button>
               </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </DashboardShell>
  );
}

import { cn } from "@/app/lib/utils";
