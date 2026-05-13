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
  CheckCircle2, 
  User as UserIcon,
  Star,
  TrendingUp,
  ExternalLink,
  Globe,
  Zap
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { Creator } from "@/app/types";



const mockCreators: Creator[] = [
  { id: 1, name: "Alex Rivera", email: "alex@rivera.com", niche: "Tech & Lifestyle", followers: "125K", rating: 4.8, status: "Active", risk: "Low", lastActive: "2m ago", earnings: "$12,400" },
  { id: 2, name: "Sarah Chen", email: "sarah@chen.co", niche: "Beauty & Wellness", followers: "85K", rating: 4.9, status: "Pending", risk: "Medium", lastActive: "1d ago", earnings: "$8,500" },
  { id: 3, name: "Marcus Thorne", email: "marcus@fitness.com", niche: "Fitness", followers: "250K", rating: 4.5, status: "Active", risk: "High", lastActive: "5d ago", earnings: "$25,000" },
  { id: 4, name: "Elena Gomez", email: "elena@foodie.com", niche: "Food & Cooking", followers: "45K", rating: 4.7, status: "Active", risk: "Low", lastActive: "3h ago", earnings: "$4,200" },
  { id: 5, name: "David Kim", email: "david@dk.com", niche: "Gaming", followers: "310K", rating: 4.6, status: "Suspended", risk: "Medium", lastActive: "1w ago", earnings: "$31,000" },
];

export default function CreatorsPage() {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const columns: ColumnDef<Creator>[] = [
    {
      accessorKey: "name",
      header: "Creator",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20">
            <UserIcon className="w-5 h-5 text-primary-blue" />
          </div>
          <div>
            <p className="text-sm font-bold text-soft-white">{row.original.name}</p>
            <p className="text-xs text-soft-white/30">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "niche",
      header: "Niche",
      cell: ({ row }) => <span className="text-xs font-medium text-soft-white/60">{row.original.niche}</span>,
    },
    {
      accessorKey: "followers",
      header: "Followers",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5 text-xs font-bold text-soft-white/40">
          <TrendingUp className="w-3.5 h-3.5 text-success" />
          <span>{row.original.followers}</span>
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <Star className="w-3 h-3 text-accent-orange fill-accent-orange" />
          <span className="text-xs font-bold text-soft-white">{row.original.rating}</span>
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
              <DropdownMenuItem onClick={() => { setSelectedCreator(row.original); setIsDrawerOpen(true); }} className="cursor-pointer focus:bg-white/5">
                <Eye className="mr-2 h-4 w-4" /> View Full Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Verify Creator
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
        title="Creator Ecosystem" 
        subtitle="Manage influencer partnerships, verify identities, and track performance."
      />

      <DataTable 
        columns={columns} 
        data={mockCreators} 
        searchKey="name"
        placeholder="Search creators..."
      />

      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedCreator?.name || "Creator Details"}
        subtitle={selectedCreator?.niche}
      >
        {selectedCreator && (
          <div className="space-y-8">
            <div className="flex items-center justify-around p-6 rounded-3xl bg-white/[0.02] border border-white/5">
               <div className="text-center">
                  <p className="text-xl font-bold text-soft-white">{selectedCreator.followers}</p>
                  <p className="text-[10px] uppercase font-black text-soft-white/30">Followers</p>
               </div>
               <div className="w-px h-8 bg-white/5" />
               <div className="text-center">
                  <p className="text-xl font-bold text-soft-white">{selectedCreator.rating}</p>
                  <p className="text-[10px] uppercase font-black text-soft-white/30">Rating</p>
               </div>
               <div className="w-px h-8 bg-white/5" />
               <div className="text-center">
                  <p className="text-xl font-bold text-primary-blue">{selectedCreator.earnings}</p>
                  <p className="text-[10px] uppercase font-black text-soft-white/30">Earnings</p>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Connected Accounts</h4>
               <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 group cursor-pointer hover:bg-white/5">
                     <Globe className="w-4 h-4 text-primary-blue" />
                     <span className="text-xs font-bold text-soft-white">{selectedCreator.email.split('@')[0]}</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 group cursor-pointer hover:bg-white/5">
                     <Zap className="w-4 h-4 text-accent-orange" />
                     <span className="text-xs font-bold text-soft-white">Verified Profile</span>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Portfolio Highlights</h4>
               <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square rounded-xl bg-black border border-white/5 overflow-hidden group relative">
                       <div className="absolute inset-0 bg-primary-blue/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Platform Notes</h4>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 italic text-sm text-soft-white/60">
                 &quot;Consistent high-quality tech reviews. Recommended for premium hardware campaigns.&quot;
               </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </DashboardShell>
  );
}
