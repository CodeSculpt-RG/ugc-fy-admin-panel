"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, User as UserIcon, 
  CheckCircle2, Clock, FileText, Video, Image as ImageIcon,
  ExternalLink, AlertCircle, Sparkles, RefreshCw, AlertTriangle, Check, PauseCircle, Ban, History
} from "lucide-react";
import { userService, UserDetailsData } from "@/app/services/userService";
import { LoadingState, ErrorState, EmptyState } from "./shared-states";
import { StatusBadge } from "./core";
import { cn } from "@/app/lib/utils";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useToast } from "@/app/hooks/useToast";

interface UserKycReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onUpdate?: () => void;
}

// Data structures expected from the new KYC API
interface KycSubmission {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  form_data: Record<string, unknown>;
  submitted_at: string;
  rejection_reason: string | null;
  internal_notes: string | null;
}

interface KycMedia {
  id: string;
  media_type: 'image' | 'video' | 'document';
  label: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  signed_url: string | null;
}

interface KycHistoryEvent {
  id: string;
  action: string;
  before_status: string | null;
  after_status: string | null;
  reason: string | null;
  created_at: string;
  admin_id: string;
}

export function UserKycReviewPanel({ isOpen, onClose, userId, onUpdate }: UserKycReviewPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserDetailsData | null>(null);
  
  // New KYC state
  const [kycData, setKycData] = useState<KycSubmission | null>(null);
  const [kycMedia, setKycMedia] = useState<KycMedia[]>([]);
  const [kycHistory, setKycHistory] = useState<KycHistoryEvent[]>([]);

  const [reason, setReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [showReasonInput, setShowReasonInput] = useState<"rejected" | "needs_review" | null>(null);

  const { hasPermission, session } = useAdminAuth();
  const { showToast } = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const fetchDetails = useCallback(async () => {
    if (!userId || !isOpen || !session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch Legacy profile details
      const res = await userService.getUserDetails(userId);
      setData(res);

      // Fetch Secure KYC System details
      const kycRes = await fetch(`/api/admin/users/${userId}/kyc`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const kycJson = await kycRes.json();
      
      if (kycJson.ok) {
        setKycData(kycJson.kyc || null);
        setKycMedia(kycJson.media || []);
        setKycHistory(kycJson.history || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load user details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, isOpen, session]);

  useEffect(() => {
    if (isOpen && userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDetails();
      setReason("");
      setInternalNotes("");
      setShowReasonInput(null);
    }
  }, [isOpen, userId, fetchDetails]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleKycDecision = async (decision: "approved" | "rejected" | "needs_review") => {
    if (!userId || !session?.access_token) return;

    if ((decision === "rejected" || decision === "needs_review") && !showReasonInput) {
      setShowReasonInput(decision);
      return;
    }

    if (decision === "rejected" && !reason.trim()) {
      showToast("A rejection reason is required.", "error");
      return;
    }

    setActionLoading(decision);
    try {
      const res = await fetch(`/api/admin/users/${userId}/kyc/decision`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ decision, reason, internal_notes: internalNotes })
      });
      
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || json.error || "Decision failed");

      showToast(`KYC successfully marked as ${decision}.`, "success");
      setReason("");
      setInternalNotes("");
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
  const legacyLogs = data?.audit_logs ?? [];

  const role = String(profile?.role ?? "User").toUpperCase();
  const name = String(
    profile?.full_name || profile?.name || brand?.company_name || brand?.brand_name ||
    creator?.creator_name || creator?.username || profile?.email || "Unnamed Entity"
  );
  const email = String(profile?.email ?? "No Email Registered");
  
  // Use new KYC status if available, fallback to legacy
  const approvalStatus = kycData?.status || String(profile?.kyc_status || profile?.approval_status || "pending");

  const formatDate = (d?: unknown) => {
    if (!d || typeof d !== "string") return "N/A";
    try { return new Date(d).toLocaleString(); } catch { return String(d); }
  };

  const safeArray = (val: unknown): unknown[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  };

  // Legacy media references
  const legacyVideos = safeArray(creator?.uploaded_videos);
  const legacyDocs = safeArray(brand?.documents);

  // Structured Secure Media references
  const securePhotos = kycMedia.filter(m => m.media_type === 'image');
  const secureVideos = kycMedia.filter(m => m.media_type === 'video');
  const secureDocs = kycMedia.filter(m => m.media_type === 'document');

  const canApprove = hasPermission("kyc.approve") || hasPermission("users.approve");
  const canReject = hasPermission("kyc.reject") || hasPermission("users.approve");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] pointer-events-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-md z-[150]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }} className="absolute right-0 top-0 h-screen w-full max-w-[760px] bg-card-bg border-l border-border z-[151] shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-border bg-surface-elevated flex items-center justify-between relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 pointer-events-none">
                <Sparkles className="w-64 h-64 text-primary" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    KYC & Identity Review
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
                <LoadingState message="Extracting KYC Data & Secure Media..." />
              ) : error ? (
                <ErrorState title="Dossier Extraction Failed" message={error} onRetry={fetchDetails} />
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
                          Tier: <span className="text-primary font-black">{role}</span>
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

                  {/* KYC Rejection Notice */}
                  {(kycData?.rejection_reason || profile?.rejection_reason) ? (
                    <div className="p-6 rounded-[24px] bg-error/10 border border-error/20 text-error flex items-start space-x-4">
                      <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Rejection Notice</p>
                        <p className="text-sm font-bold text-error mt-1 leading-relaxed">{String(kycData?.rejection_reason || profile.rejection_reason)}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* 1. KYC Form Answers */}
                  {kycData?.form_data && Object.keys(kycData.form_data).length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Submitted KYC Answers</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(kycData.form_data).map(([key, val]) => (
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
                  ) : null}

                  {/* 2. Identity Overview */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                      <UserIcon className="w-4 h-4 text-primary" />
                      <span>Identity Overview</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Full Legal Name</span>
                        <p className="text-sm font-black text-foreground truncate">{String(profile?.full_name ?? "Not Registered")}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Contact Email</span>
                        <p className="text-sm font-black text-primary truncate">{email}</p>
                      </div>
                    </div>
                  </div>

                  {/* SECURE MEDIA GALLERY */}
                  {(securePhotos.length > 0 || secureVideos.length > 0 || secureDocs.length > 0 || legacyVideos.length > 0 || legacyDocs.length > 0) ? (
                    <div className="space-y-6 pt-4 border-t border-border">
                      <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                        <ImageIcon className="w-4 h-4 text-accent-orange" />
                        <span>Secure Media Uploads</span>
                      </h3>

                      {securePhotos.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Identity Photos</span>
                          <div className="grid grid-cols-2 gap-4">
                            {securePhotos.map((photo) => (
                              <a key={photo.id} href={photo.signed_url || '#'} target="_blank" rel="noopener noreferrer" className="block relative aspect-square rounded-2xl overflow-hidden border border-border hover:border-primary transition-all group bg-background/50">
                                {photo.signed_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={photo.signed_url} alt={photo.label || 'KYC Photo'} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                    <AlertCircle className="w-8 h-8 text-error mb-2" />
                                    <span className="text-xs text-error font-bold">Failed to load signed URL</span>
                                  </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                  <p className="text-[10px] font-black text-white truncate">{photo.label || 'Identity Document'}</p>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {(secureVideos.length > 0 || legacyVideos.length > 0) && (
                        <div className="space-y-3 pt-4 border-t border-border/50">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Video Verification</span>
                          <div className="space-y-4">
                            {secureVideos.map((video) => (
                              <div key={video.id} className="rounded-2xl border border-border bg-black overflow-hidden relative">
                                {video.signed_url ? (
                                  <video controls className="w-full aspect-video" preload="metadata">
                                    <source src={video.signed_url} type={video.mime_type || "video/mp4"} />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : (
                                  <div className="w-full aspect-video flex items-center justify-center bg-surface border border-error/20 text-error">
                                    Broken secure link.
                                  </div>
                                )}
                                <div className="p-3 bg-surface-elevated border-t border-border flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground">{video.label || 'Video Verification'}</span>
                                  <a href={video.signed_url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline">Download</a>
                                </div>
                              </div>
                            ))}
                            {legacyVideos.map((vidItem: unknown, i: number) => {
                              const vidUrl = typeof vidItem === 'string' ? vidItem : String((vidItem as Record<string, unknown>)?.url || '');
                              return vidUrl ? (
                                <a key={`leg-vid-${i}`} href={vidUrl} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-foreground/5 border border-border hover:border-primary transition-all flex items-center space-x-3 group">
                                  <div className="p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0"><Video className="w-4 h-4" /></div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-foreground truncate">Legacy Video #{i + 1}</p>
                                    <p className="text-[10px] font-mono text-foreground/40 truncate">{vidUrl}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-foreground/30 group-hover:text-primary" />
                                </a>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {(secureDocs.length > 0 || legacyDocs.length > 0) && (
                        <div className="space-y-3 pt-4 border-t border-border/50">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Corporate/Identity Documents</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {secureDocs.map((doc) => (
                              <a key={doc.id} href={doc.signed_url || '#'} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-foreground/5 border border-border hover:border-accent-orange/40 transition-all flex items-center space-x-3 group">
                                <div className="p-3 rounded-lg bg-accent-orange/10 text-accent-orange flex-shrink-0"><FileText className="w-4 h-4" /></div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black text-foreground truncate">{doc.label || 'Document'}</p>
                                  <p className="text-[10px] font-mono text-foreground/40 truncate">Secure Signed Download</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-foreground/30 group-hover:text-primary" />
                              </a>
                            ))}
                            {legacyDocs.map((docItem: unknown, i: number) => {
                              const docUrl = typeof docItem === 'string' ? docItem : String((docItem as Record<string, unknown>)?.url || '');
                              return docUrl ? (
                                <a key={`leg-doc-${i}`} href={docUrl} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-foreground/5 border border-border hover:border-accent-orange transition-all flex items-center space-x-3 group">
                                  <div className="p-3 rounded-lg bg-foreground/10 text-foreground/60 flex-shrink-0"><FileText className="w-4 h-4" /></div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-foreground truncate">Legacy Document #{i + 1}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-foreground/30 group-hover:text-primary" />
                                </a>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* KYC History Timeline */}
                  <div className="space-y-6 pt-6 border-t border-border">
                    <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 mb-4">
                      <History className="w-4 h-4 text-primary" />
                      <span>KYC Audit Ledger</span>
                    </h3>

                    <div className="space-y-4">
                      {kycHistory.length > 0 ? kycHistory.map((h) => (
                        <div key={h.id} className="p-5 rounded-2xl bg-foreground/5 border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center space-x-2">
                              {h.action === 'approved' ? <CheckCircle2 className="w-4 h-4 text-success-green" /> : h.action === 'rejected' ? <Ban className="w-4 h-4 text-error" /> : <Clock className="w-4 h-4 text-warning" />}
                              <span>{h.action}</span>
                            </span>
                            <span className="text-[10px] font-mono text-foreground/40">{formatDate(h.created_at)}</span>
                          </div>
                          {h.reason && <p className="text-xs text-error font-bold bg-error/10 p-2 rounded">Reason: {h.reason}</p>}
                        </div>
                      )) : legacyLogs.map((logItem: unknown, idx: number) => {
                        const log = logItem as Record<string, unknown>;
                        return (
                          <div key={idx} className="p-4 rounded-xl bg-surface-elevated border border-border flex items-center justify-between">
                            <span className="text-xs text-foreground/60">Legacy Audit: {String(log?.action)}</span>
                            <span className="text-[10px] text-foreground/40">{formatDate(log?.created_at)}</span>
                          </div>
                        );
                      })}
                      {kycHistory.length === 0 && legacyLogs.length === 0 && (
                        <p className="text-xs text-foreground/40 italic">No history found.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification / Approval Controls */}
            {profile && (
              <div className="p-6 border-t border-border bg-surface-elevated space-y-4 sticky bottom-0 z-20">
                {showReasonInput && (
                  <div className="space-y-2 p-4 rounded-2xl bg-background/40 border border-border animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-foreground/80 flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-accent-orange" />
                        <span>Justification Reason for {showReasonInput.toUpperCase()}</span>
                      </label>
                      <button onClick={() => setShowReasonInput(null)} className="text-foreground/40 hover:text-foreground text-xs font-bold">Cancel</button>
                    </div>
                    <input
                      type="text"
                      placeholder={`Enter reason for ${showReasonInput}...`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary mb-2"
                    />
                    <input
                      type="text"
                      placeholder="Optional Internal Notes (Admin Only)"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                    />
                    <div className="flex justify-end pt-2">
                      <button onClick={() => handleKycDecision(showReasonInput)} disabled={showReasonInput === 'rejected' && !reason.trim() || Boolean(actionLoading)} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-95 disabled:opacity-50", showReasonInput === "rejected" ? "bg-error hover:bg-error/90" : "bg-accent-orange hover:bg-accent-orange/90")}>
                        {actionLoading === showReasonInput ? "Executing..." : `Confirm ${showReasonInput.toUpperCase()}`}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {canApprove && (
                    <button onClick={() => handleKycDecision("approved")} disabled={Boolean(actionLoading) || approvalStatus === "approved"} className="flex-1 min-w-[140px] h-12 rounded-2xl bg-success-green text-white text-xs font-black uppercase tracking-widest hover:bg-success-green/90 transition-all shadow-xl shadow-success-green/20 active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span>{actionLoading === "approved" ? "Approving..." : "Approve"}</span>
                    </button>
                  )}
                  {canReject && (
                    <>
                      <button onClick={() => handleKycDecision("needs_review")} disabled={Boolean(actionLoading) || approvalStatus === "needs_review" || approvalStatus === "pending_review"} className="flex-1 min-w-[140px] h-12 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2">
                        <PauseCircle className="w-4 h-4" />
                        <span>{actionLoading === "needs_review" ? "Holding..." : "Hold / Needs Review"}</span>
                      </button>

                      <button onClick={() => handleKycDecision("rejected")} disabled={Boolean(actionLoading) || approvalStatus === "rejected"} className="flex-1 min-w-[140px] h-12 rounded-2xl bg-foreground/5 border border-border text-foreground/80 hover:text-white hover:bg-error/20 hover:border-error/40 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2">
                        <Ban className="w-4 h-4 text-error" />
                        <span>{actionLoading === "rejected" ? "Rejecting..." : "Reject"}</span>
                      </button>
                    </>
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
