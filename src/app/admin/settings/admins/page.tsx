"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { EmptyState } from "@/app/components/shared/EmptyState";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Loader2,
  RefreshCw,
  User as UserIcon,
  AlertTriangle,
} from "lucide-react";
import { AdminUser, AdminRole } from "@/lib/auth/admin-types";

export default function AdminManagementSettingsPage() {
  const { admin, session } = useAdminAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Invite Form State
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");

  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    targetId: string;
    updates: { status?: string; role?: string };
    targetEmail: string;
    actionType: "suspend" | "revoke" | "activate";
  } | null>(null);

  // Safeguard Check: Only owner is allowed
  const isOwner = admin?.email?.toLowerCase().trim() === "ugcfybycreatornavigator@gmail.com";

  useEffect(() => {
    if (!loading && !isOwner) {
      showToast("Access Denied: Owner credentials required for this module.", "error");
      router.push("/admin/dashboard");
    }
  }, [isOwner, loading, router, showToast]);

  const loadAdmins = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/invites", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setAdmins(data.data);
      } else {
        showToast(data.message || "Failed to sync nodes.", "error");
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
      fetch("/api/admin/invites", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (active && data.ok) {
            setAdmins(data.data);
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Email address is required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, full_name: fullName, role }),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        showToast(`Invite created successfully for ${email}`, "success");
        setEmail("");
        setFullName("");
        setRole("admin");
        loadAdmins();
      } else {
        showToast(data.message || "Failed to create invite.", "error");
      }
    } catch {
      showToast("Failed to contact invite service.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (targetId: string, updates: { status?: string; role?: string }, targetEmail: string) => {
    // Owner safeguard check: block action against owner
    if (targetEmail.toLowerCase().trim() === "ugcfybycreatornavigator@gmail.com") {
      showToast("Security Protocol: Owner account parameters cannot be modified.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/invites/revoke", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminUserId: targetId, ...updates }),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        showToast("Administrative profile updated successfully.", "success");
        loadAdmins();
      } else {
        showToast(data.message || "Action execution failed.", "error");
      }
    } catch {
      showToast("Failed to contact update service.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOwner) {
    return (
      <DashboardShell>
        <div className="section-spacing text-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground/40 font-bold uppercase tracking-wider text-xs">Verifying owner parameters...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader
          title="Administrative Infrastructure"
          subtitle="Provision new nodes, assign access vectors, and configure operation permission profiles."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card-bg border border-border rounded-[32px] p-6 shadow-premium relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-md font-black text-foreground tracking-tight">Active Nodes Registry</h3>
                <button
                  onClick={loadAdmins}
                  disabled={loading}
                  className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-wider text-foreground/40 hover:text-primary transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Sync Registry</span>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-xs text-foreground/40 uppercase font-black tracking-widest">Reading database records...</p>
                </div>
              ) : admins.length === 0 ? (
                <EmptyState title="No Admins" description="No administrative nodes recorded in the system." className="py-10" />
              ) : (
                <div className="w-full overflow-x-auto rounded-2xl border border-border bg-surface custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border/60 text-[10px] uppercase font-black tracking-widest text-foreground/40">
                        <th className="pb-3 pl-2">Admin Profile</th>
                        <th className="pb-3">Access Vector</th>
                        <th className="pb-3">Last Connection</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {admins.map((adm) => {
                        const isOwnerRow = adm.email.toLowerCase().trim() === "ugcfybycreatornavigator@gmail.com";
                        return (
                          <tr key={adm.id} className="text-foreground hover:bg-foreground/[0.02] transition-all">
                            <td className="py-4 pl-2 min-w-[200px]">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center shrink-0">
                                  <UserIcon className="w-4 h-4 text-foreground/30" />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-black tracking-tight">{adm.full_name || "Invited Admin"}</p>
                                  <p className="text-[10px] text-foreground/40 font-bold uppercase mt-1 truncate">{adm.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 font-black uppercase text-[10px] tracking-wider">
                              <span className={`px-2 py-0.5 rounded ${isOwnerRow ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground/60"}`}>
                                {adm.role}
                              </span>
                            </td>
                            <td className="py-4 text-[10px] font-bold text-foreground/40 tracking-tighter uppercase whitespace-nowrap">
                              {adm.last_login_at ? new Date(adm.last_login_at).toLocaleString() : "Never connected"}
                            </td>
                            <td className="py-4">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                adm.status === "active"
                                  ? "bg-success-green/10 text-success-green border border-success-green/20"
                                  : adm.status === "suspended"
                                  ? "bg-error/10 text-error border border-error/20"
                                  : adm.status === "revoked"
                                  ? "bg-foreground/10 text-foreground/40 border border-border"
                                  : "bg-warning/10 text-warning border border-warning/20"
                              }`}>
                                {adm.status}
                              </span>
                            </td>
                            <td className="py-4 text-right pr-2 whitespace-nowrap">
                              {isOwnerRow ? (
                                <span className="text-[9px] font-black uppercase text-foreground/20 tracking-wider">Locked</span>
                              ) : (
                                <div className="inline-flex space-x-2">
                                  {adm.status === "active" ? (
                                    <button
                                      onClick={() => setConfirmModalState({
                                        isOpen: true,
                                        targetId: adm.id,
                                        updates: { status: "suspended" },
                                        targetEmail: adm.email,
                                        actionType: "suspend",
                                      })}
                                      disabled={submitting}
                                      className="px-2.5 py-1 bg-warning/10 border border-warning/20 text-warning hover:bg-warning/20 transition-all text-[9px] font-black uppercase tracking-wider rounded"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAction(adm.id, { status: "active" }, adm.email)}
                                      disabled={submitting}
                                      className="px-2.5 py-1 bg-success-green/10 border border-success-green/20 text-success-green hover:bg-success-green/20 transition-all text-[9px] font-black uppercase tracking-wider rounded"
                                    >
                                      Activate
                                    </button>
                                  )}

                                  {adm.status !== "revoked" && (
                                    <button
                                      onClick={() => setConfirmModalState({
                                        isOpen: true,
                                        targetId: adm.id,
                                        updates: { status: "revoked" },
                                        targetEmail: adm.email,
                                        actionType: "revoke",
                                      })}
                                      disabled={submitting}
                                      className="px-2.5 py-1 bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-all text-[9px] font-black uppercase tracking-wider rounded"
                                    >
                                      Revoke
                                    </button>
                                  )}

                                  <select
                                    value={adm.role}
                                    disabled={submitting}
                                    onChange={(e) => handleAction(adm.id, { role: e.target.value }, adm.email)}
                                    className="px-1.5 py-0.5 bg-surface-elevated border border-border text-[9px] font-black uppercase tracking-wider rounded focus:outline-none"
                                  >
                                    <option value="super_admin">Super Admin</option>
                                    <option value="admin">Admin</option>
                                    <option value="kyc_manager">KYC Mgr</option>
                                    <option value="campaign_manager">Campaign Mgr</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="support">Support</option>
                                    <option value="finance">Finance</option>
                                  </select>
                                </div>
                              )}
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

          <div className="space-y-6">
            <div className="bg-card-bg border border-border rounded-[32px] p-6 shadow-premium relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-md font-black text-foreground tracking-tight leading-none">Provision Admin Node</h3>
                  <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-1.5">Invite new admin email</p>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Network Identifier (Email)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full h-12 bg-surface-elevated border border-border rounded-xl px-4 text-foreground text-xs font-bold tracking-tight focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Full Identity Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-12 bg-surface-elevated border border-border rounded-xl px-4 text-foreground text-xs font-bold tracking-tight focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Operational Vector (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AdminRole)}
                    className="w-full h-12 bg-surface-elevated border border-border rounded-xl px-4 text-foreground text-xs font-bold focus:outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="super_admin">Super Admin (Full Access)</option>
                    <option value="admin">Platform Admin (Standard Access)</option>
                    <option value="kyc_manager">KYC Manager (Compliance & Review)</option>
                    <option value="campaign_manager">Campaign Manager (Campaign Actions)</option>
                    <option value="moderator">Content Moderator (Trust & Safety)</option>
                    <option value="support">Support Agent (Disputes & Tickets)</option>
                    <option value="finance">Finance Administrator (Milestones & Escrow)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Dispatch Invitation</span>
                </button>
              </form>
            </div>

            <div className="bg-card-bg border border-border rounded-[32px] p-6 shadow-premium relative overflow-hidden flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center shrink-0 mt-1">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-warning uppercase tracking-widest">Operational Directive</h4>
                <p className="text-[11px] text-foreground/50 leading-relaxed font-bold">
                  Owner role and status are globally protected. You can revoke or suspend standard admin nodes but you cannot modify the owner account properties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmModalState && (
        <ConfirmModal
          isOpen={confirmModalState.isOpen}
          onClose={() => setConfirmModalState(null)}
          onConfirm={() => handleAction(confirmModalState.targetId, confirmModalState.updates, confirmModalState.targetEmail)}
          title={`${confirmModalState.actionType} Admin`}
          description={`Are you sure you want to ${confirmModalState.actionType} ${confirmModalState.targetEmail}? This action will take effect immediately.`}
          variant={confirmModalState.actionType === "revoke" ? "danger" : "warning"}
          confirmText={`Confirm ${confirmModalState.actionType}`}
          loading={submitting}
          showInput={false}
          confirmTextToType={confirmModalState.actionType === "revoke" ? "REVOKE" : undefined}
        />
      )}
    </DashboardShell>
  );
}
