"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { DataTable } from "@/app/components/ui/data-table";
import { DetailDrawer } from "@/app/components/ui/detail-drawer";
import { ColumnDef } from "@tanstack/react-table";
import { 
  MoreVertical, 
  Eye, 
  Play, 
  Pause, 
  XCircle,
  Building,
  Users,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { Campaign } from "@/app/types";

const mockCampaigns: Campaign[] = [
  { id: 1, name: "Summer Tech Blast", brand: "TechNova", budget: "$12,000", creators: 24, submissions: 18, deadline: "2026-06-15", status: "Active" },
  { id: 2, name: "Glow Skin Routine", brand: "Luxe Beauty", budget: "$8,500", creators: 12, submissions: 4, deadline: "2026-06-20", status: "Pending" },
  { id: 3, name: "Fitness App Launch", brand: "FitStep", budget: "$15,000", creators: 45, submissions: 42, deadline: "2026-05-30", status: "Completed" },
  { id: 4, name: "Organic Energy Drink", brand: "PureFuel", budget: "$5,000", creators: 8, submissions: 0, deadline: "2026-07-01", status: "Draft" },
  { id: 5, name: "Cyber Gaming Setup", brand: "Razer Edge", budget: "$25,000", creators: 15, submissions: 15, deadline: "2026-05-10", status: "Disputed" },
];

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: "name",
      header: "Campaign",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20">
            <FileText className="w-5 h-5 text-accent-orange" />
          </div>
          <div>
            <p className="text-sm font-bold text-soft-white">{row.original.name}</p>
            <p className="text-xs text-soft-white/30">{row.original.brand}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "budget",
      header: "Budget",
      cell: ({ row }) => <span className="text-sm font-bold text-soft-white">{row.original.budget}</span>,
    },
    {
      accessorKey: "creators",
      header: "Creators",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 text-xs font-medium text-soft-white/60">
          <Users className="w-3.5 h-3.5" />
          <span>{row.original.creators}</span>
        </div>
      ),
    },
    {
      accessorKey: "submissions",
      header: "Progress",
      cell: ({ row }) => {
        const progress = (row.original.submissions / row.original.creators) * 100;
        return (
          <div className="w-24 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-soft-white/40">
              <span>{row.original.submissions}/{row.original.creators}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-blue transition-all" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 text-xs text-soft-white/60">
          <Calendar className="w-3.5 h-3.5" />
          <span>{row.original.deadline}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          variant={
            row.original.status === "Active" ? "success" : 
            row.original.status === "Completed" ? "info" : 
            row.original.status === "Pending" ? "warning" : 
            row.original.status === "Disputed" ? "error" : "default"
          } 
        />
      ),
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
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-soft-white/30">Campaign Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { setSelectedCampaign(row.original); setIsDrawerOpen(true); }} className="cursor-pointer focus:bg-white/5">
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5 text-success">
                <Play className="mr-2 h-4 w-4" /> Resume Campaign
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5 text-warning">
                <Pause className="mr-2 h-4 w-4" /> Pause Campaign
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="cursor-pointer text-error focus:bg-error/5 focus:text-error">
                <XCircle className="mr-2 h-4 w-4" /> Reject Campaign
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
        title="Campaign Management" 
        subtitle="Monitor, approve, and moderate active influencer marketing campaigns."
      >
        <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl">
          Create Campaign
        </Button>
      </PageHeader>

      <DataTable 
        columns={columns} 
        data={mockCampaigns} 
        searchKey="name"
        placeholder="Search campaigns..."
      />

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedCampaign?.name || "Campaign Details"}
        subtitle={selectedCampaign?.brand}
      >
        {selectedCampaign && (
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-soft-white/40 font-medium">Budget</span>
                <span className="text-xl font-bold text-soft-white">{selectedCampaign.budget}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-soft-white/40 font-medium">Escrow Status</span>
                <StatusBadge status="Fully Funded" variant="success" />
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Campaign Overview</h4>
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02]">
                     <Building className="w-4 h-4 text-primary-blue" />
                     <div className="flex-1">
                        <p className="text-[10px] text-soft-white/30 uppercase font-bold">Brand Entity</p>
                        <p className="text-sm font-bold text-soft-white">{selectedCampaign.brand}</p>
                     </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02]">
                     <DollarSign className="w-4 h-4 text-primary-blue" />
                     <div className="flex-1">
                        <p className="text-[10px] text-soft-white/30 uppercase font-bold">Platform Fee (15%)</p>
                        <p className="text-sm font-bold text-soft-white">$1,800</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Recent Submissions</h4>
               <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-video rounded-xl bg-black border border-white/5 overflow-hidden group relative cursor-pointer">
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-6 h-6 text-white" />
                       </div>
                       <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                          <p className="text-[8px] font-bold text-white truncate">Submission #{i}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <Button variant="ghost" className="w-full text-xs font-bold text-primary-blue">
                  View All {selectedCampaign.submissions} Submissions
               </Button>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Administrative Control</h4>
               <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-success/10 hover:bg-success text-success hover:text-white border border-success/20 font-bold rounded-xl h-12">
                    Approve
                  </Button>
                  <Button className="bg-error/10 hover:bg-error text-error hover:text-white border border-error/20 font-bold rounded-xl h-12">
                    Reject
                  </Button>
               </div>
               <Button variant="outline" className="w-full border-white/10 text-soft-white/60 font-bold rounded-xl h-12">
                 Escalate to Legal
               </Button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </DashboardShell>
  );
}
