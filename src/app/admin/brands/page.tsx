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
  Building2, 
  CheckCircle2, 
  Briefcase,
  Globe,
  Mail,
  MapPin
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { Brand } from "@/app/types";



const mockBrands: Brand[] = [
  { id: 1, name: "TechNova", email: "admin@technova.com", company: "TechNova Inc.", industry: "Technology", activeCampaigns: 4, totalSpend: "$142,000", status: "Active", risk: "Low", lastActive: "1h ago", disputes: 0 },
  { id: 2, name: "Luxe Beauty", email: "contact@luxe.co", company: "Luxe Beauty Group", industry: "Cosmetics", activeCampaigns: 2, totalSpend: "$68,500", status: "Active", risk: "Low", lastActive: "3h ago", disputes: 0 },
  { id: 3, name: "FitStep", email: "marketing@fitstep.fit", company: "FitStep Labs", industry: "Health & Fitness", activeCampaigns: 1, totalSpend: "$25,000", status: "Pending", risk: "Medium", lastActive: "1d ago", disputes: 1 },
  { id: 4, name: "PureFuel", email: "hello@purefuel.com", company: "PureFuel Beverages", industry: "Beverages", activeCampaigns: 0, totalSpend: "$12,400", status: "Active", risk: "Low", lastActive: "5d ago", disputes: 0 },
  { id: 5, name: "Razer Edge", email: "ops@razer.com", company: "Razer Edge Gaming", industry: "Gaming Hardware", activeCampaigns: 3, totalSpend: "$310,000", status: "Suspended", risk: "High", lastActive: "12h ago", disputes: 2 },
];

export default function BrandsPage() {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "name",
      header: "Brand",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20">
            <Building2 className="w-5 h-5 text-accent-orange" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
               <p className="text-sm font-bold text-soft-white">{row.original.name}</p>
               {row.original.status === "Active" && <CheckCircle2 className="w-3 h-3 text-primary-blue fill-primary-blue/10" />}
            </div>
            <p className="text-xs text-soft-white/30">{row.original.industry}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "activeCampaigns",
      header: "Active Campaigns",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 text-xs font-bold text-soft-white/60">
          <Briefcase className="w-3.5 h-3.5" />
          <span>{row.original.activeCampaigns}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalSpend",
      header: "Total GMV",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1 text-sm font-bold text-soft-white">
          <span className="text-primary-blue">$</span>
          <span>{row.original.totalSpend.replace('$', '')}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          variant={row.original.status === "Active" ? "success" : row.original.status === "Pending" ? "warning" : "error"} 
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
              <DropdownMenuItem onClick={() => { setSelectedBrand(row.original); setIsDrawerOpen(true); }} className="cursor-pointer focus:bg-white/5">
                <Eye className="mr-2 h-4 w-4" /> Company Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                <Mail className="mr-2 h-4 w-4" /> Contact Billing
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
        title="Brand Partnerships" 
        subtitle="Manage corporate accounts, review campaign budgets, and track brand engagement."
      />

      <DataTable 
        columns={columns} 
        data={mockBrands} 
        searchKey="name"
        placeholder="Search brands..."
      />

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedBrand?.name || "Brand Details"}
        subtitle={`${selectedBrand?.industry} • Partner since 2024`}
      >
        {selectedBrand && (
          <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-xs text-soft-white/40 font-bold uppercase tracking-widest">Total Investment</span>
                  <span className="text-2xl font-black text-soft-white">{selectedBrand.totalSpend}</span>
               </div>
               <div className="h-px bg-white/5 w-full" />
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-[10px] text-soft-white/30 uppercase font-black mb-1">Active Campaigns</p>
                     <p className="text-lg font-bold text-soft-white">{selectedBrand.activeCampaigns}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-soft-white/30 uppercase font-black mb-1">Creators Hired</p>
                     <p className="text-lg font-bold text-soft-white">42</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Corporate Identity</h4>
               <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                     <Globe className="w-4 h-4 text-primary-blue" />
                     <span className="text-soft-white">www.{selectedBrand.name.toLowerCase().replace(' ', '')}.com</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                     <Mail className="w-4 h-4 text-primary-blue" />
                     <span className="text-soft-white">{selectedBrand.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                     <MapPin className="w-4 h-4 text-primary-blue" />
                     <span className="text-soft-white">New York, USA</span>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Top Campaign Metrics</h4>
               <div className="space-y-4">
                  {[
                    { label: "Completion Rate", value: "98%", trend: "+2%" },
                    { label: "Avg. Engagement", value: "4.2%", trend: "+0.5%" },
                    { label: "ROI Multiple", value: "3.5x", trend: "+1.2x" }
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01]">
                       <span className="text-xs text-soft-white/60 font-medium">{metric.label}</span>
                       <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-soft-white">{metric.value}</span>
                          <span className="text-[10px] font-bold text-success">{metric.trend}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="pt-8 border-t border-white/5">
               <Button className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white font-bold rounded-xl h-12">
                 Generate Partner Report
               </Button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </DashboardShell>
  );
}
