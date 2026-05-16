"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { supabase } from "@/lib/supabase/client";

type ApiError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

type DebugProfile = {
  id: string;
  email: string | null;
  role: "creator" | "brand" | "admin" | string;
  approval_status: "pending_review" | "approved" | "rejected" | "blocked" | string;
  profile_completed: boolean | null;
  created_at: string | null;
};

type HealthResponse = {
  success: boolean;
  supabaseConnected?: boolean;
  source?: string;
  environment?: string;
  timestamp?: string;
  profilesCount?: number;
  creatorsCount?: number;
  brandsCount?: number;
  pendingUsersCount?: number;
  error?: ApiError;
};

type DebugRealDataResponse = {
  success: boolean;
  source?: string;
  message?: string;
  profiles?: DebugProfile[];
  creator_profiles?: Record<string, unknown>[];
  brand_profiles?: Record<string, unknown>[];
  error?: ApiError;
};

export default function DebugConnectionPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [realData, setRealData] = useState<DebugRealDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runDiagnostics() {
      if (process.env.NODE_ENV !== "development") {
        setError("This page is only available in development mode.");
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Fetch Health Data
        const healthRes = await fetch('/api/admin/health', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          }
        });
        const healthPayload = await healthRes.json() as HealthResponse;
        setHealth(healthPayload);

        // Fetch Real Data Debug
        const realDataRes = await fetch('/api/admin/debug-real-data', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          }
        });
        const realDataPayload = await realDataRes.json() as DebugRealDataResponse;
        setRealData(realDataPayload);

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load debug connection data";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    runDiagnostics();
  }, []);

  if (loading) return (
    <DashboardShell>
      <div className="p-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Probing System Integrity...</p>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Diagnostic Vector" 
          subtitle="Real-time connectivity and database integrity analysis."
        />

        {error ? (
          <div className="p-8 rounded-[32px] bg-error/10 border border-error/20 text-error">
            <h4 className="font-black uppercase text-xs mb-2">Diagnostic Blocked</h4>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Infrastructure Status */}
              <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium">
                <h3 className="text-xl font-black text-white tracking-tighter mb-8">Infrastructure Ledger</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-white/[0.05]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Supabase Connection</span>
                    <StatusBadge 
                      status={health?.supabaseConnected ? "ONLINE" : "OFFLINE"} 
                      variant={health?.supabaseConnected ? "success" : "error"}
                    />
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-white/[0.05]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Data Source</span>
                    <span className="text-sm font-black text-white">{health?.source || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-white/[0.05]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Environment</span>
                    <span className="text-sm font-black text-primary-blue uppercase tracking-widest">{health?.environment}</span>
                  </div>
                </div>
              </div>

              {/* Database Population */}
              <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium">
                <h3 className="text-xl font-black text-white tracking-tighter mb-8">Ecosystem Density</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Profiles</p>
                    <p className="text-3xl font-black text-white">{health?.profilesCount || 0}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Creators</p>
                    <p className="text-3xl font-black text-white">{health?.creatorsCount || 0}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Brands</p>
                    <p className="text-3xl font-black text-white">{health?.brandsCount || 0}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Pending</p>
                    <p className="text-3xl font-black text-accent-orange">{health?.pendingUsersCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Latest Profiles Sync */}
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white tracking-tighter">Live Database Sync</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Direct Read: profiles table</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/20">ID</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/20">Email</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/20">Role</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {realData?.profiles?.map((p) => (
                      <tr key={p.id} className="group">
                        <td className="py-4 text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors">{p.id.slice(0, 8)}...</td>
                        <td className="py-4 text-xs font-black text-white/80">{p.email}</td>
                        <td className="py-4 text-[10px] font-black uppercase tracking-widest text-primary-blue">{p.role}</td>
                        <td className="py-4">
                          <StatusBadge 
                            status={p.approval_status} 
                            variant={p.approval_status === "approved" ? "success" : p.approval_status === "pending_review" ? "warning" : "error"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {health?.error && (
              <div className="p-8 rounded-[32px] bg-red-500/10 border border-red-500/20 text-red-500">
                <h4 className="font-black uppercase text-xs mb-2">Diagnostic Error Ledger</h4>
                <p className="text-sm font-bold">{health.error.message}</p>
                <p className="text-[10px] mt-2 opacity-60 font-mono">Code: {health.error.code}</p>
                <p className="text-[10px] mt-1 opacity-60 font-mono">Hint: {health.error.hint}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

