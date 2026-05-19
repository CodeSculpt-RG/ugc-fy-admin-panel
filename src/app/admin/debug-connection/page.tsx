"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader, StatusBadge } from "@/app/components/ui/core";
import { supabase } from "@/lib/supabase/client";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { ShieldCheck, Fingerprint, Lock, Server } from "lucide-react";

type ApiErrorDetail = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

type TableDiagnosticItem = {
  table: string;
  exists: boolean;
  count?: number;
  rows?: Array<Record<string, unknown>>;
  error?: ApiErrorDetail | null;
};

type HealthPayload = {
  success: boolean;
  source?: string;
  data?: {
    supabaseConnected: boolean;
    checkedAt: string;
    tables: TableDiagnosticItem[];
  };
  error?: string | Record<string, unknown>;
};

type DebugRealDataPayload = {
  success: boolean;
  source?: string;
  message?: string;
  env?: {
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    hasServiceRoleKey: boolean;
  };
  data?: Record<string, TableDiagnosticItem>;
  error?: string | Record<string, unknown>;
};

export default function DebugConnectionPage() {
  const { admin } = useAdminAuth();
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [realData, setRealData] = useState<DebugRealDataPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  useEffect(() => {
    async function runDiagnostics() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : "",
          'Content-Type': 'application/json'
        };

        const healthRes = await fetch('/api/admin/health', { headers });
        if (healthRes.status === 401 || healthRes.status === 403) {
          setAuthError("Unauthorized: Administrative privilege 'infrastructure.read' required to view system connectivity.");
          setLoading(false);
          return;
        }
        if (!healthRes.ok) {
          throw new Error(`Health check returned status ${healthRes.status}`);
        }
        const healthData = (await healthRes.json()) as HealthPayload;
        setHealth(healthData);

        const realDataRes = await fetch('/api/admin/debug-real-data', { headers });
        if (realDataRes.status === 401 || realDataRes.status === 403) {
          setAuthError("Unauthorized: Administrative privilege 'infrastructure.read' required to view real data debugging.");
          setLoading(false);
          return;
        }
        if (!realDataRes.ok) {
          throw new Error(`Real data check returned status ${realDataRes.status}`);
        }
        const realPayload = (await realDataRes.json()) as DebugRealDataPayload;
        setRealData(realPayload);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Infrastructure diagnostic failed to connect.";
        setNetworkError(msg);
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

  const tables = health?.data?.tables ?? [];
  const envStatus = realData?.env ?? { hasSupabaseUrl: false, hasAnonKey: false, hasServiceRoleKey: false };
  const profilesTableRows = realData?.data?.profiles?.rows ?? [];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Diagnostic Vector" 
          subtitle="Real-time connectivity and database integrity analysis."
        />

        {authError ? (
          <div className="p-8 rounded-[32px] bg-warning/10 border border-warning/20 text-warning">
            <h4 className="font-black uppercase text-xs mb-2">Authorization Required</h4>
            <p className="text-sm">{authError}</p>
          </div>
        ) : networkError ? (
          <div className="p-8 rounded-[32px] bg-error/10 border border-error/20 text-error">
            <h4 className="font-black uppercase text-xs mb-2">Diagnostic Blocked</h4>
            <p className="text-sm">{networkError}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Current Session Auth Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] flex items-start space-x-5 shadow-premium relative overflow-hidden">
                  <div className="w-14 h-14 rounded-[20px] bg-primary-blue/10 flex items-center justify-center border border-primary-blue/15 shrink-0">
                     <Fingerprint className="w-7 h-7 text-primary-blue" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F0F0FB]/20 mb-2">Authenticated Admin</h4>
                     <p className="text-sm font-black text-[#F0F0FB] tracking-tight leading-none truncate">{admin?.name || "System Node"}</p>
                     <p className="text-[11px] text-[#F0F0FB]/40 mt-3 truncate">{admin?.email || "No session email"}</p>
                  </div>
               </div>

               <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] flex items-start space-x-5 shadow-premium relative overflow-hidden">
                  <div className="w-14 h-14 rounded-[20px] bg-accent-orange/10 flex items-center justify-center border border-accent-orange/15 shrink-0">
                     <Lock className="w-7 h-7 text-accent-orange" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F0F0FB]/20 mb-2">Administrative Role</h4>
                     <p className="text-sm font-black text-accent-orange tracking-tight leading-none uppercase">{admin?.role || "NO_ROLE"}</p>
                     <p className="text-[11px] text-[#F0F0FB]/40 mt-3">Platform Authority Level</p>
                  </div>
               </div>

               <div className="p-8 rounded-[32px] bg-[#111827] border border-white/[0.08] flex items-start space-x-5 shadow-premium relative overflow-hidden">
                  <div className="w-14 h-14 rounded-[20px] bg-success-green/10 flex items-center justify-center border border-success-green/15 shrink-0">
                     <ShieldCheck className="w-7 h-7 text-success-green" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F0F0FB]/20 mb-2">Permissions Hydrated</h4>
                     <p className="text-sm font-black text-success-green tracking-tight leading-none">{admin?.permissions.length || 0} Vectors Active</p>
                     <div className="flex flex-wrap gap-1 mt-3">
                        {admin?.permissions.slice(0, 3).map(p => (
                          <span key={p} className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[9px] font-black text-white/40 uppercase tracking-tighter border border-white/[0.05]">{p.split('.')[0]}</span>
                        ))}
                        {(admin?.permissions.length || 0) > 3 && <span className="text-[9px] text-white/20 font-black">+{(admin?.permissions.length || 0) - 3} more</span>}
                     </div>
                  </div>
               </div>
            </div>

            {/* Supabase Env Status */}
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium">
              <div className="flex items-center space-x-3 mb-8">
                <Server className="w-6 h-6 text-primary-blue" />
                <h3 className="text-xl font-black text-white tracking-tighter">Supabase Edge Environment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-[#111827] border border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">Supabase URL</span>
                  <StatusBadge status={envStatus.hasSupabaseUrl ? "CONFIGURED" : "MISSING"} variant={envStatus.hasSupabaseUrl ? "success" : "error"} />
                </div>
                <div className="p-6 rounded-2xl bg-[#111827] border border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">Client Anon Key</span>
                  <StatusBadge status={envStatus.hasAnonKey ? "CONFIGURED" : "MISSING"} variant={envStatus.hasAnonKey ? "success" : "error"} />
                </div>
                <div className="p-6 rounded-2xl bg-[#111827] border border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">Service Role Key</span>
                  <StatusBadge status={envStatus.hasServiceRoleKey ? "SECURED" : "MISSING"} variant={envStatus.hasServiceRoleKey ? "success" : "error"} />
                </div>
              </div>
            </div>

            {/* Table Verification Diagnostics */}
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white tracking-tighter">Production Database Table Audit</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Checked: {health?.data?.checkedAt ? new Date(health.data.checkedAt).toLocaleTimeString() : "Live"}</span>
              </div>

              {tables.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">No Table Diagnostics Returned</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {tables.map((t) => (
                    <div key={t.table} className="p-6 rounded-2xl bg-[#111827] border border-white/[0.08] flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-white/80 truncate pr-2" title={t.table}>{t.table}</span>
                        <StatusBadge status={t.exists ? "EXISTS" : "MISSING"} variant={t.exists ? "success" : "error"} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Rows</p>
                        <p className="text-2xl font-black text-white mt-1">{t.count ?? 0}</p>
                      </div>
                      {!t.exists && t.error && (
                        <div className="pt-2 border-t border-error/20 text-[10px] font-mono text-error/80">
                          <p className="truncate">{t.error.message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Latest Profiles Sync */}
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-[32px] p-10 shadow-premium space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white tracking-tighter">Live Profile Sample Rows</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Table: profiles</span>
              </div>
              
              {profilesTableRows.length === 0 ? (
                <div className="p-12 text-center bg-[#111827] rounded-2xl border border-white/[0.05]">
                  <p className="text-xs text-white/40 font-bold">No profile rows available in database.</p>
                </div>
              ) : (
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
                      {profilesTableRows.map((p) => {
                        const idStr = String(p.id ?? "unknown");
                        const emailStr = String(p.email ?? "no-email");
                        const roleStr = String(p.role ?? "user");
                        const approvalStr = String(p.approval_status ?? "pending_review");
                        return (
                          <tr key={idStr} className="group">
                            <td className="py-4 text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors">{idStr.slice(0, 8)}...</td>
                            <td className="py-4 text-xs font-black text-white/80">{emailStr}</td>
                            <td className="py-4 text-[10px] font-black uppercase tracking-widest text-primary-blue">{roleStr}</td>
                            <td className="py-4">
                               <StatusBadge 
                                 status={approvalStr === "approved" ? "Approved" : approvalStr} 
                                 variant={approvalStr === "approved" ? "success" : "warning"}
                               />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
