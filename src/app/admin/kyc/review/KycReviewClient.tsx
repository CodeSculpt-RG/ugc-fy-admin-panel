"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, ShieldCheck, Clock, Ban, ArrowRight, RefreshCw } from "lucide-react";
import { approvalService, PendingUser } from "@/app/services/approvalService";
import { KycReviewModal } from "@/app/components/dashboard/KycReviewModal";
import { StatusBadge } from "@/app/components/ui/core";
import { cn } from "@/app/lib/utils";
import { formatDateStable } from "@/lib/utils/formatDate";

interface KycReviewClientProps {
  initialApprovals: PendingUser[];
}

export function KycReviewClient({ initialApprovals }: KycReviewClientProps) {
  const router = useRouter();
  const [approvals, setApprovals] = useState<PendingUser[]>(initialApprovals);
  const [loading, setLoading] = useState(false);
  
  const [roleFilter, setRoleFilter] = useState<"all" | "creator" | "brand">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "blocked">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch approvals when filters change
  useEffect(() => {
    let mounted = true;
    const fetchApprovals = async () => {
      setLoading(true);
      try {
        const data = await approvalService.getApprovals(statusFilter, roleFilter);
        if (mounted) setApprovals(data);
      } catch (err) {
        console.error("Failed to fetch approvals:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchApprovals();
    
    return () => { mounted = false; };
  }, [roleFilter, statusFilter]);

  const refreshTable = async () => {
    setLoading(true);
    try {
      const data = await approvalService.getApprovals(statusFilter, roleFilter);
      setApprovals(data);
      router.refresh();
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApprovals = approvals.filter(user => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (user.full_name && user.full_name.toLowerCase().includes(q)) ||
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 mt-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="p-4 rounded-2xl bg-surface-elevated border border-border shadow-sm flex items-center justify-between">
           <div>
             <p className="text-xs font-black uppercase text-foreground/40 tracking-widest">Total Pending</p>
             <p className="text-2xl font-black mt-1">{initialApprovals.length}</p>
           </div>
           <Clock className="w-8 h-8 text-primary opacity-20" />
         </div>
         <div className="p-4 rounded-2xl bg-surface-elevated border border-border shadow-sm flex items-center justify-between">
           <div>
             <p className="text-xs font-black uppercase text-foreground/40 tracking-widest">Creators</p>
             <p className="text-2xl font-black mt-1">{initialApprovals.filter(u => u.role === 'creator').length}</p>
           </div>
           <ShieldCheck className="w-8 h-8 text-emerald-600 opacity-20" />
         </div>
         <div className="p-4 rounded-2xl bg-surface-elevated border border-border shadow-sm flex items-center justify-between">
           <div>
             <p className="text-xs font-black uppercase text-foreground/40 tracking-widest">Brands</p>
             <p className="text-2xl font-black mt-1">{initialApprovals.filter(u => u.role === 'brand').length}</p>
           </div>
           <ShieldCheck className="w-8 h-8 text-accent-orange opacity-20" />
         </div>
         <div className="p-4 rounded-2xl bg-error/5 border border-error/20 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-xs font-black uppercase text-error/60 tracking-widest">Rejected Queue</p>
             <p className="text-2xl font-black text-error mt-1">{statusFilter === 'rejected' ? approvals.length : '-'}</p>
           </div>
           <Ban className="w-8 h-8 text-error opacity-20" />
         </div>
      </div>

      {/* Filters & Search Row */}
      <div className="p-4 sm:p-6 rounded-[24px] bg-surface-elevated border border-border flex flex-col sm:flex-row gap-6 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-foreground/40"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-background border border-border">
            {(["all", "creator", "brand"] as const).map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  roleFilter === role ? "bg-primary text-white shadow-md" : "text-foreground/40 hover:text-foreground"
                )}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 p-1 rounded-xl bg-background border border-border">
            {(["all", "pending", "approved", "rejected", "blocked"] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === status ? "bg-foreground text-background shadow-md" : "text-foreground/40 hover:text-foreground"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="rounded-[24px] bg-surface-elevated border border-border overflow-hidden shadow-sm relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {filteredApprovals.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <Filter className="w-12 h-12 text-foreground/10 mb-4" />
            <h3 className="text-lg font-black text-foreground">No records found</h3>
            <p className="text-sm text-foreground/40 mt-1 max-w-sm">
              We couldn&apos;t find any users matching your current search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-foreground/5 text-foreground/60 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Wait Time</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApprovals.map((user) => {
                  const createdAt = user.created_at ? new Date(user.created_at) : new Date();
                  const waitDays = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={user.id} onClick={() => setSelectedUserId(user.id)} className="hover:bg-foreground/5 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{user.full_name || "Unknown"}</p>
                            <p className="text-[10px] font-mono text-foreground/40">{user.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                          user.role === 'creator' ? "bg-emerald-500/10 text-emerald-600" :
                          user.role === 'brand' ? "bg-accent-orange/10 text-accent-orange" :
                          "bg-foreground/10 text-foreground"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge 
                          status={user.approval_status?.replace('_', ' ') || 'pending'} 
                          variant={user.approval_status === 'approved' ? 'success' : user.approval_status === 'rejected' || user.approval_status === 'blocked' ? 'error' : 'warning'}
                        />
                      </td>
                      <td className="px-6 py-4 text-foreground/60 text-xs">{formatDateStable(user.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                          waitDays > 3 && user.approval_status === 'pending_review' ? "bg-error/10 text-error" : "bg-warning/10 text-warning-text"
                        )}>
                          <Clock className="w-3 h-3 mr-1" /> {waitDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-black uppercase tracking-wider transition-colors group-hover:bg-primary group-hover:text-white">
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <KycReviewModal 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
        userId={selectedUserId}
        onUpdate={refreshTable}
      />
    </div>
  );
}
