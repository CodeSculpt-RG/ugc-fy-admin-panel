"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, User as UserIcon, CheckCircle2, FileText, Image as ImageIcon,
  AlertCircle, RefreshCw, AlertTriangle, Check, Ban, History, ShieldAlert, ShieldCheck
} from "lucide-react";
import { approvalService } from "@/app/services/approvalService";
import { LoadingState, ErrorState, EmptyState } from "../ui/shared-states";
import { StatusBadge } from "../ui/core";
import { cn } from "@/app/lib/utils";
import { formatDateStable } from "@/lib/utils/formatDate";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useToast } from "@/app/hooks/useToast";

interface KycReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onUpdate?: () => void;
}

export function KycReviewModal({ isOpen, onClose, userId, onUpdate }: KycReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);

  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState<"rejected" | "blocked" | null>(null);

  const { hasPermission } = useAdminAuth();
  const { showToast } = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const fetchDetails = useCallback(async () => {
    if (!userId || !isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await approvalService.getUserFullDetails(userId);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load user details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, isOpen]);

  useEffect(() => {
    if (isOpen && userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDetails();
      setReason("");
      setShowReasonInput(null);
    }
  }, [isOpen, userId, fetchDetails]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleDecision = async (decision: "approved" | "rejected" | "blocked" | "pending_review") => {
    if (!userId) return;

    if ((decision === "rejected" || decision === "blocked") && !showReasonInput) {
      setShowReasonInput(decision);
      return;
    }

    if ((decision === "rejected" || decision === "blocked") && !reason.trim()) {
      showToast(`A reason is required to ${decision} a user.`, "error");
      return;
    }

    setActionLoading(decision);
    try {
      await approvalService.updateApprovalStatus(userId, decision as "approved" | "rejected" | "blocked" | "pending_review", reason);
      
      showToast(`User successfully marked as ${decision}.`, "success");
      setReason("");
      setShowReasonInput(null);
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Action failed: ${msg}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (!mounted) return null;

  const profile = data?.profile;
  const creator = data?.creator_profile;
  const brand = data?.brand_profile;
  const kyc = data?.kyc_submission;
  const auditLogs = data?.audit_logs || [];

  const role = String(profile?.role ?? "User").toUpperCase();
  const name = String(
    profile?.full_name || brand?.company_name || brand?.brand_name ||
    creator?.creator_name || creator?.username || profile?.email || "Unnamed Entity"
  );
  const email = String(profile?.email ?? "Email not available");
  const approvalStatus = String(profile?.approval_status || "pending");
  const isBlocked = approvalStatus === "blocked";

  const formatDate = (d?: unknown) => {
    if (!d || typeof d !== "string") return "N/A";
    try { return formatDateStable(d); } catch { return String(d); }
  };

  const canApprove = hasPermission("kyc.approve") || hasPermission("users.approve");
  const canReject = hasPermission("kyc.reject") || hasPermission("users.approve");
  const canBlock = hasPermission("users.block");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] pointer-events-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-md z-[150]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }} className="absolute right-0 top-0 h-screen w-full max-w-[760px] bg-card-bg border-l border-border z-[151] shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-border bg-surface-elevated flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    Profile Review
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-foreground/5 border border-border text-foreground/60 font-mono">
                    ID: {profile?.id ? String(profile.id).substring(0,8) : "N/A"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter truncate">{name}</h2>
              </div>
              <div className="flex items-center space-x-3 z-10 flex-shrink-0">
                <button onClick={fetchDetails} disabled={loading} className="p-3 rounded-2xl bg-foreground/5 border border-border text-foreground/40 hover:text-white hover:bg-foreground/10 transition-all active:scale-95 disabled:opacity-50">
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
                <button onClick={onClose} className="p-3 rounded-2xl bg-foreground/5 border border-border text-foreground/40 hover:text-white hover:bg-foreground/10 transition-all active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar pb-32">
              {loading ? (
                <LoadingState message="Extracting User Details..." />
              ) : error ? (
                <ErrorState title="Extraction Failed" message={error} onRetry={fetchDetails} />
              ) : !profile ? (
                <EmptyState title="No Identity Profile Located" description="The user ID provided does not correspond to an established profile entry." />
              ) : (
                <div className="space-y-10">
                  {/* Status Banner */}
                  <div className="p-6 rounded-[24px] bg-surface-elevated border border-border flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 font-black text-xl">
                        {String(name).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground tracking-tight truncate">{email}</p>
                        <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest mt-0.5">
                          Type: <span className="text-primary font-black">{role}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <StatusBadge 
                        status={approvalStatus.replace('_', ' ')}
                        variant={approvalStatus === 'approved' ? 'success' : (approvalStatus === 'rejected' || approvalStatus === 'blocked') ? 'error' : 'warning'}
                      />
                    </div>
                  </div>

                  {/* Rejection / Block Notice */}
                  {(profile?.rejection_reason) ? (
                    <div className="p-6 rounded-[24px] bg-error/10 border border-error/20 text-error flex items-start space-x-4">
                      <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">{approvalStatus === 'blocked' ? 'Block Reason' : 'Rejection Reason'}</p>
                        <p className="text-sm font-bold text-error mt-1 leading-relaxed">{String(profile.rejection_reason)}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* 1. Identity Overview */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                      <UserIcon className="w-4 h-4 text-primary" />
                      <span>Identity Overview</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Full Legal Name</span>
                        <p className="text-sm font-black text-foreground truncate">{String(profile?.full_name ?? "Not provided")}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Contact Email</span>
                        <p className="text-sm font-black text-primary truncate">{email}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Joined</span>
                        <p className="text-sm font-black text-foreground truncate">{formatDate(profile?.created_at)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Last Updated</span>
                        <p className="text-sm font-black text-foreground truncate">{formatDate(profile?.updated_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Role Specific Info */}
                  {profile.role === "creator" && creator && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                        <ImageIcon className="w-4 h-4 text-accent-orange" />
                        <span>Creator Specifics</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Handle</span>
                          <p className="text-sm font-black text-foreground truncate">{creator.username || "Not provided"}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Niche / Category</span>
                          <p className="text-sm font-black text-foreground truncate">{creator.niche || "Not provided"}</p>
                        </div>
                        <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Bio</span>
                          <p className="text-sm font-black text-foreground">{creator.bio || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.role === "brand" && brand && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                        <FileText className="w-4 h-4 text-accent-orange" />
                        <span>Brand Specifics</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Company Name</span>
                          <p className="text-sm font-black text-foreground truncate">{brand.company_name || "Not provided"}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Website</span>
                          {brand.website ? (
                            <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-primary hover:underline truncate block">
                              {brand.website}
                            </a>
                          ) : (
                            <p className="text-sm font-black text-foreground truncate">Not provided</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. KYC Submissions */}
                  {kyc && kyc.form_data && Object.keys(kyc.form_data).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Submitted KYC Fields</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(kyc.form_data).map(([key, val]) => (
                          <div key={key} className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                            <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                            {typeof val === 'object' && val !== null ? (
                              <pre className="text-xs font-mono text-foreground/60 bg-background/50 p-2 rounded overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>
                            ) : (
                              <p className="text-sm font-black text-foreground">{String(val)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Audit History Timeline */}
                  <div className="space-y-6 pt-6 border-t border-border">
                    <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 mb-4">
                      <History className="w-4 h-4 text-primary" />
                      <span>Admin Decision History</span>
                    </h3>

                    <div className="space-y-4">
                      {auditLogs.length > 0 ? auditLogs.map((h: { id: string; action: string; created_at: string; metadata?: { reason?: string }; actor?: { full_name?: string; email?: string }; actor_admin_id?: string }) => (
                        <div key={h.id} className="p-5 rounded-2xl bg-foreground/5 border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center space-x-2">
                              {h.action.includes('approve') ? <CheckCircle2 className="w-4 h-4 text-success-green" /> : h.action.includes('reject') ? <Ban className="w-4 h-4 text-error" /> : h.action.includes('block') ? <ShieldAlert className="w-4 h-4 text-error" /> : <History className="w-4 h-4 text-warning" />}
                              <span>{h.action}</span>
                            </span>
                            <span className="text-[10px] font-mono text-foreground/40">{formatDate(h.created_at)}</span>
                          </div>
                          {h.metadata?.reason && <p className="text-xs text-error font-bold bg-error/10 p-2 rounded">Reason: {h.metadata.reason}</p>}
                          <p className="text-[10px] text-foreground/40 mt-1">By Admin: {h.actor?.full_name || h.actor?.email || h.actor_admin_id}</p>
                        </div>
                      )) : (
                        <p className="text-xs text-foreground/40 italic">No audit history found for this user.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification / Approval Controls */}
            {profile && (
              <div className="p-6 border-t border-border bg-surface-elevated space-y-4 sticky bottom-0 z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.2)]">
                {showReasonInput && (
                  <div className="space-y-2 p-4 rounded-2xl bg-background/40 border border-border animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-foreground/80 flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-accent-orange" />
                        <span>Reason for {showReasonInput.toUpperCase()}</span>
                      </label>
                      <button onClick={() => setShowReasonInput(null)} className="text-foreground/40 hover:text-foreground text-xs font-bold">Cancel</button>
                    </div>
                    <input
                      type="text"
                      placeholder={`Enter mandatory reason to ${showReasonInput} user...`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary mb-2"
                    />
                    <div className="flex justify-end pt-2">
                      <button onClick={() => handleDecision(showReasonInput)} disabled={!reason.trim() || Boolean(actionLoading)} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-95 disabled:opacity-50", showReasonInput === "blocked" ? "bg-red-600 hover:bg-red-700" : "bg-error hover:bg-error/90")}>
                        {actionLoading === showReasonInput ? "Executing..." : `Confirm ${showReasonInput.toUpperCase()}`}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {canApprove && !isBlocked && (
                    <button onClick={() => handleDecision("approved")} disabled={Boolean(actionLoading) || approvalStatus === "approved"} className="flex-1 min-w-[140px] h-12 rounded-2xl bg-success-green text-white text-xs font-black uppercase tracking-widest hover:bg-success-green/90 transition-all shadow-xl shadow-success-green/20 active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span>{actionLoading === "approved" ? "Approving..." : "Approve"}</span>
                    </button>
                  )}
                  {canReject && !isBlocked && (
                    <button onClick={() => handleDecision("rejected")} disabled={Boolean(actionLoading) || approvalStatus === "rejected"} className="flex-1 min-w-[140px] h-12 rounded-2xl bg-foreground/5 border border-border text-foreground/80 hover:text-white hover:bg-error/20 hover:border-error/40 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2">
                      <Ban className="w-4 h-4 text-error" />
                      <span>{actionLoading === "rejected" ? "Rejecting..." : "Reject"}</span>
                    </button>
                  )}
                  
                  {canBlock && (
                    isBlocked ? (
                      <button onClick={() => handleDecision("pending_review")} disabled={Boolean(actionLoading)} className="flex-1 min-w-[140px] h-12 rounded-2xl bg-foreground/5 border border-border text-foreground/80 hover:text-white hover:bg-foreground/20 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{actionLoading === "pending_review" ? "Unblocking..." : "Unblock User"}</span>
                      </button>
                    ) : (
                      <button onClick={() => handleDecision("blocked")} disabled={Boolean(actionLoading)} className="flex-1 min-w-[140px] h-12 rounded-2xl bg-foreground/5 border border-border text-foreground/80 hover:text-white hover:bg-red-600/20 hover:border-red-600/40 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>{actionLoading === "blocked" ? "Blocking..." : "Block"}</span>
                      </button>
                    )
                  )}
                  
                  {(!canApprove && !canReject && !canBlock) && (
                     <div className="flex-1 text-center py-2 text-xs text-foreground/40 italic">
                       You do not have permission to approve, reject, or block users.
                     </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
