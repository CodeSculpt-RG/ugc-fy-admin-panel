"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { EmptyState } from "@/app/components/shared/EmptyState";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";
import {
  Ban,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Clock,
  AlertOctagon,
  UserCheck,
} from "lucide-react";

type BanRecord = {
  id: string;
  ban_type: "email" | "ip";
  value: string;
  reason: string | null;
  severity: "temporary" | "permanent";
  banned_until: string | null;
  banned_by: string | null;
  created_at: string;
};

export default function BanManagementSettingsPage() {
  const { admin, session } = useAdminAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [bans, setBans] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [banType, setBanType] = useState<"email" | "ip">("email");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"temporary" | "permanent">("temporary");
  const [durationMinutes, setDurationMinutes] = useState("30");

  const isOwner = admin?.email?.toLowerCase().trim() === "ugcfybycreatornavigator@gmail.com";

  useEffect(() => {
    if (!loading && !isOwner) {
      showToast("Access Denied: Owner credentials required.", "error");
      router.push("/admin/dashboard");
    }
  }, [isOwner, loading, router, showToast]);

  const loadBans = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/security/bans", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setBans(data.data);
      } else {
        showToast(data.message || "Failed to sync bans registry.", "error");
      }
    } catch {
      showToast("System synchronization error.", "error");
    } finally {
      setLoading(false);
    }
  }, [session, showToast]);

  useEffect(() => {
    let active = true;
    if (isOwner && session?.access_token) {
      fetch("/api/admin/security/bans", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (active && data.ok) {
            setBans(data.data);
          }
        })
        .catch(() => {
          showToast("System synchronization error.", "error");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [isOwner, session, showToast]);

  const handleAddBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) {
      showToast("Ban target identifier (value) is required.", "error");
      return;
    }

    // Owner protection safeguard on browser
    if (banType === "email" && value.toLowerCase().trim() === "ugcfybycreatornavigator@gmail.com") {
      showToast("Security Protocol: Banning the primary owner account is prohibited.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/security/bans", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ban_type: banType,
          value,
          reason,
          severity,
          durationMinutes: severity === "temporary" ? parseInt(durationMinutes, 10) : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        showToast(`Successfully created ${banType} ban for ${value}.`, "success");
        setValue("");
        setReason("");
        loadBans();
      } else {
        showToast(data.message || "Failed to establish ban.", "error");
      }
    } catch {
      showToast("Banning service connection failure.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnban = async (banId: string) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/security/unban", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ banId }),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        showToast("Ban lifted successfully.", "success");
        loadBans();
      } else {
        showToast(data.message || "Unban execution failed.", "error");
      }
    } catch {
      showToast("Unbanning service connection failure.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOwner) {
    return (
      <DashboardShell>
        <div className="section-spacing text-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground/40 font-bold uppercase tracking-wider text-xs">Verifying security parameters...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader
          title="Administrative Ban Management"
          subtitle="Configure manual IP and email constraints to restrict unauthorized system access."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card-bg border border-border rounded-[32px] p-6 shadow-premium relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-error" />
                </div>
                <h3 className="text-md font-black text-foreground tracking-tight">Active Bans Directory</h3>
              </div>

              <button
                onClick={loadBans}
                disabled={loading}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-wider text-foreground/40 hover:text-primary transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Sync Registry</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-14">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-xs text-foreground/40 uppercase font-black tracking-widest">Reading database filters...</p>
              </div>
            ) : bans.length === 0 ? (
              <EmptyState title="No Bans" description="No active constraints recorded." className="py-14" />
            ) : (
              <div className="w-full overflow-x-auto rounded-2xl border border-border bg-surface custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase font-black tracking-widest text-foreground/40">
                      <th className="pb-3 pl-2">Target Type</th>
                      <th className="pb-3">Value</th>
                      <th className="pb-3">Reason</th>
                      <th className="pb-3">Severity / Expiry</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-foreground text-xs font-medium">
                    {bans.map((ban) => (
                      <tr key={ban.id} className="hover:bg-foreground/[0.01] transition-all">
                        <td className="py-4 pl-2 font-black uppercase text-[10px] tracking-wider">
                          <span className={`px-2 py-0.5 rounded ${ban.ban_type === "ip" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                            {ban.ban_type}
                          </span>
                        </td>
                        <td className="py-4 font-mono font-bold text-foreground/75 truncate max-w-[200px]">
                          {ban.value}
                        </td>
                        <td className="py-4 text-foreground/60 text-xs max-w-[220px] truncate">
                          {ban.reason || "No reason recorded"}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          {ban.severity === "permanent" ? (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-error/15 text-error border border-error/10">
                              Permanent
                            </span>
                          ) : (
                            <div className="flex items-center space-x-1 text-foreground/40 text-[10px] font-bold uppercase">
                              <Clock className="w-3.5 h-3.5 text-warning shrink-0" />
                              <span className="truncate max-w-[120px]">
                                {ban.banned_until ? new Date(ban.banned_until).toLocaleString() : "Temporary"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={() => handleUnban(ban.id)}
                            disabled={submitting}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-success-green/10 border border-success-green/20 text-success-green hover:bg-success-green/20 transition-all text-[9px] font-black uppercase tracking-wider rounded-lg disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Lift Ban</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card-bg border border-border rounded-[32px] p-6 shadow-premium relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/30 to-transparent" />
              
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-error/10 border border-error/20 rounded-xl flex items-center justify-center">
                  <Ban className="w-5 h-5 text-error" />
                </div>
                <div>
                  <h3 className="text-md font-black text-foreground tracking-tight leading-none">Register Constraint</h3>
                  <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-1.5">Configure manual block</p>
                </div>
              </div>

              <form onSubmit={handleAddBan} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Ban Type</label>
                  <select
                    value={banType}
                    onChange={(e) => {
                      setBanType(e.target.value as "email" | "ip");
                      setValue("");
                    }}
                    className="w-full h-12 bg-surface-elevated border border-border rounded-xl px-4 text-foreground text-xs font-bold focus:outline-none"
                  >
                    <option value="email">Email Ban</option>
                    <option value="ip">IP Address Ban</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Target Value</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={banType === "email" ? "malicious@domain.com" : "192.168.1.1"}
                    required
                    className="w-full h-12 bg-surface-elevated border border-border rounded-xl px-4 text-foreground text-xs font-bold tracking-tight focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Reason for Ban</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Suspicious automated login attempts"
                    className="w-full h-12 bg-surface-elevated border border-border rounded-xl px-4 text-foreground text-xs font-bold tracking-tight focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as "temporary" | "permanent")}
                    className="w-full h-12 bg-surface-elevated border border-border rounded-xl px-4 text-foreground text-xs font-bold focus:outline-none"
                  >
                    <option value="temporary">Temporary Block</option>
                    <option value="permanent">Permanent Block</option>
                  </select>
                </div>

                {severity === "temporary" && (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Duration (Minutes)</label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-full h-12 bg-surface-elevated border border-border rounded-xl px-4 text-foreground text-xs font-bold focus:outline-none"
                    >
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="1440">24 Hours (1 Day)</option>
                      <option value="10080">7 Days (1 Week)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-error text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-error/95 transition-all shadow-lg shadow-error/20 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  <span>Establish Constraint</span>
                </button>
              </form>
            </div>

            <div className="bg-card-bg border border-border rounded-[32px] p-6 shadow-premium relative overflow-hidden flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center shrink-0 mt-1">
                <AlertOctagon className="w-5 h-5 text-error" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-error uppercase tracking-widest">Global Restraints</h4>
                <p className="text-[11px] text-foreground/50 leading-relaxed font-bold">
                  Banning the primary owner email is strictly blocked at the database, API, and frontend levels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
