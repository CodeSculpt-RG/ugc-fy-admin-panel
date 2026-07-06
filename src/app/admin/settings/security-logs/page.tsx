"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { EmptyState } from "@/app/components/shared/EmptyState";
import { PageHeader } from "@/app/components/ui/core";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Loader2,
  RefreshCw,
  Clock,
  Activity,
} from "lucide-react";

type SecurityEvent = {
  id: string;
  admin_user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  event_type: string;
  severity: "info" | "warning" | "critical";
  metadata: Record<string, unknown>;
  created_at: string;
  admin_users?: {
    email: string;
    full_name: string | null;
  } | null;
};

export default function SecurityLogsSettingsPage() {
  const { admin, session } = useAdminAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const isOwner = admin?.email?.toLowerCase().trim() === "ugcfybycreatornavigator@gmail.com";

  useEffect(() => {
    if (!loading && !isOwner) {
      showToast("Access Denied: Owner credentials required for this module.", "error");
      router.push("/admin/dashboard");
    }
  }, [isOwner, loading, router, showToast]);

  const loadEvents = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/security/events?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setEvents(data.data);
        setCount(data.count);
      } else {
        showToast(data.message || "Failed to load security events.", "error");
      }
    } catch {
      showToast("System synchronization error.", "error");
    } finally {
      setLoading(false);
    }
  }, [session, offset, showToast]);

  useEffect(() => {
    let active = true;
    if (isOwner && session?.access_token) {
      fetch(`/api/admin/security/events?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (active && data.ok) {
            setEvents(data.data);
            setCount(data.count);
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
  }, [isOwner, session, offset, showToast]);

  if (!isOwner) {
    return (
      <DashboardShell>
        <div className="section-spacing text-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground/40 font-bold uppercase tracking-wider text-xs">Verifying security clearances...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader
          title="Security Audits & Event Logs"
          subtitle="Real-time ledger of administrative logins, email checks, credential updates, and suspicious activities."
        />

        <div className="bg-card-bg border border-border rounded-[32px] p-6 shadow-premium relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-error" />
              </div>
              <h3 className="text-md font-black text-foreground tracking-tight">Access Log & Event Ledger</h3>
            </div>

            <button
              onClick={loadEvents}
              disabled={loading}
              className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-wider text-foreground/40 hover:text-primary transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-14">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-xs text-foreground/40 uppercase font-black tracking-widest">Parsing audit streams...</p>
            </div>
          ) : events.length === 0 ? (
            <EmptyState title="No Events" description="No security events currently recorded." className="py-14" />
          ) : (
            <div className="space-y-4">
              <div className="w-full overflow-x-auto rounded-2xl border border-border bg-surface custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase font-black tracking-widest text-foreground/40">
                      <th className="pb-3 pl-2">Event Signature</th>
                      <th className="pb-3">Origin Identifier</th>
                      <th className="pb-3">IP Address</th>
                      <th className="pb-3">Severity</th>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3 pr-2 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-foreground">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-foreground/[0.01] transition-all text-xs font-medium">
                        <td className="py-4 pl-2 min-w-[200px]">
                          <div className="flex items-center space-x-2.5">
                            <Activity className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-black text-[11px] tracking-wider uppercase text-foreground/80">
                              {evt.event_type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 truncate max-w-[180px]">
                          {evt.admin_users ? (
                            <div>
                              <p className="font-bold">{evt.admin_users.full_name || "Enterprise Node"}</p>
                              <p className="text-[10px] text-foreground/40 uppercase font-black tracking-tight">{evt.email}</p>
                            </div>
                          ) : evt.email ? (
                            <span className="text-[10px] font-black uppercase text-foreground/50">{evt.email}</span>
                          ) : (
                            <span className="text-foreground/20 italic">None</span>
                          )}
                        </td>
                        <td className="py-4 font-mono text-[11px] text-foreground/50">
                          {evt.ip_address || "Unknown"}
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                            evt.severity === "critical"
                              ? "bg-error/10 text-error border-error/20"
                              : evt.severity === "warning"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}>
                            {evt.severity}
                          </span>
                        </td>
                        <td className="py-4 text-[10px] font-bold text-foreground/40 tracking-tighter uppercase whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{new Date(evt.created_at).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right pr-2">
                          {evt.metadata && Object.keys(evt.metadata).length > 0 ? (
                            <button
                              onClick={() => {
                                showToast(`Metadata: ${JSON.stringify(evt.metadata)}`, "info");
                              }}
                              className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                            >
                              Inspect
                            </button>
                          ) : (
                            <span className="text-foreground/20">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/30">
                  Showing {offset + 1} - {Math.min(offset + limit, count)} of {count} events
                </span>
                <div className="inline-flex space-x-2">
                  <button
                    disabled={offset === 0}
                    onClick={() => {
                      setLoading(true);
                      setOffset(Math.max(0, offset - limit));
                    }}
                    className="px-4 py-2 bg-surface-elevated border border-border text-foreground hover:bg-foreground/5 transition-all text-[10px] font-black uppercase tracking-wider rounded-xl disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={offset + limit >= count}
                    onClick={() => {
                      setLoading(true);
                      setOffset(offset + limit);
                    }}
                    className="px-4 py-2 bg-surface-elevated border border-border text-foreground hover:bg-foreground/5 transition-all text-[10px] font-black uppercase tracking-wider rounded-xl disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
