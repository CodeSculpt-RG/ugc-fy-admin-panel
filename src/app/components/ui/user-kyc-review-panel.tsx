"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, User as UserIcon, Building2, 
  CheckCircle2, Clock, ShieldCheck, FileText, Video, 
  ExternalLink, AlertCircle, Sparkles, RefreshCw, Share2, AlertTriangle, Check, PauseCircle, Ban
} from "lucide-react";
import { userService, UserDetailsData } from "@/app/services/userService";
import { approvalService } from "@/app/services/approvalService";
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

export function UserKycReviewPanel({ isOpen, onClose, userId, onUpdate }: UserKycReviewPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserDetailsData | null>(null);
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
      const res = await userService.getUserDetails(userId);
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
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleApprovalAction = async (status: "approved" | "pending_review" | "rejected" | "blocked") => {
    if (!userId) return;

    if ((status === "rejected" || status === "blocked") && !showReasonInput) {
      setShowReasonInput(status);
      return;
    }

    setActionLoading(status);
    try {
      await approvalService.updateApprovalStatus(userId, status, reason || (status === "approved" ? "Manual administrative approval" : "Administrative directive"));
      showToast(`User status successfully updated to ${status}.`, "success");
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
  const logs = data?.audit_logs ?? [];

  const role = String(profile?.role ?? "User").toUpperCase();
  const name = String(
    profile?.full_name ||
    profile?.name ||
    brand?.company_name ||
    brand?.brand_name ||
    brand?.contact_name ||
    creator?.creator_name ||
    creator?.username ||
    profile?.email ||
    profile?.platform_id ||
    "Unnamed Entity"
  );
  const email = String(profile?.email ?? "No Email Registered");
  const approvalStatus = String(profile?.approval_status ?? "pending_review");

  const formatDate = (d?: unknown) => {
    if (!d || typeof d !== "string") return "N/A";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  const safeArray = (val: unknown): unknown[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const videos = safeArray(creator?.uploaded_videos);
  const portfolio = safeArray(creator?.portfolio_links);
  const docs = safeArray(brand?.documents);

  const canApprove = hasPermission("users.approve");
  const canBlock = hasPermission("users.block");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md z-[150]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="absolute right-0 top-0 h-screen w-full max-w-[760px] bg-card-bg border-l border-border z-[151] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-border bg-surface-elevated flex items-center justify-between relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 pointer-events-none">
                <Sparkles className="w-64 h-64 text-primary" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    KYC & Identity Dossier
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-foreground/5 border border-border text-foreground/60 font-mono">
                    ID: {profile?.platform_id ? String(profile.platform_id) : (userId ? `${userId.substring(0, 8)}...` : "N/A")}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter truncate">
                  {name}
                </h2>
              </div>
              <div className="flex items-center space-x-3 z-10 flex-shrink-0">
                <button
                  onClick={fetchDetails}
                  disabled={loading}
                  title="Refresh Dossier Data"
                  className="p-3 rounded-2xl bg-foreground/5 border border-border text-foreground/40 hover:text-white hover:bg-foreground/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-foreground/5 border border-border text-foreground/40 hover:text-white hover:bg-foreground/10 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar pb-32">
              {loading ? (
                <LoadingState message="Extracting KYC & Dossier Metadata..." />
              ) : error ? (
                <ErrorState title="Dossier Extraction Failed" message={error} onRetry={fetchDetails} />
              ) : !profile ? (
                <EmptyState 
                  title="No Identity Profile Located" 
                  description="The user ID provided does not correspond to an established profile entry in the ledger."
                />
              ) : (
                <div className="space-y-10">
                  {/* Status & Security Banner */}
                  <div className="p-6 rounded-[24px] bg-surface-elevated border border-border flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 font-black text-xl">
                        {String(name).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground tracking-tight truncate">{email}</p>
                        <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest mt-0.5">
                          Ecosystem Tier: <span className="text-primary font-black">{role}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <StatusBadge 
                        status={approvalStatus === 'pending_review' ? 'Pending Review' : approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'blocked' ? 'Blocked' : 'Rejected'}
                        variant={approvalStatus === 'approved' ? 'success' : approvalStatus === 'pending_review' ? 'warning' : 'error'}
                      />
                      {Boolean(profile?.profile_completed) && (
                        <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-success-green/10 border border-success-green/20 text-success-green text-[10px] font-black uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>KYC Completed</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rejection / Block Reason Notice */}
                  {Boolean(profile?.rejection_reason) && (
                    <div className="p-6 rounded-[24px] bg-error/10 border border-error/20 text-error flex items-start space-x-4">
                      <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Administrative Directive Notice</p>
                        <p className="text-sm font-bold text-error mt-1 leading-relaxed">{String(profile.rejection_reason)}</p>
                      </div>
                    </div>
                  )}

                  {/* 1. Identity Overview */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                      <UserIcon className="w-4 h-4 text-primary" />
                      <span>1. Identity Overview</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Full Legal Name</span>
                        <p className="text-sm font-black text-foreground truncate">{String(profile?.full_name ?? "Not Registered")}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Contact Email</span>
                        <p className="text-sm font-black text-primary truncate">{String(profile?.email ?? "N/A")}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Identity Created</span>
                        <p className="text-xs font-mono text-foreground/80">{formatDate(profile?.created_at)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Last Infrastructure Update</span>
                        <p className="text-xs font-mono text-foreground/80">{formatDate(profile?.updated_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Creator Details if role = creator */}
                  {profile.role === "creator" && (
                    <div className="space-y-6 pt-4 border-t border-border">
                      <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                        <UserIcon className="w-4 h-4 text-primary" />
                        <span>2. Creator KYC & Portfolio Data</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Creator Stage Name</span>
                          <p className="text-sm font-black text-foreground truncate">{String(creator?.creator_name ?? profile.full_name ?? "N/A")}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Strategic Niche</span>
                          <p className="text-sm font-black text-primary uppercase tracking-wider">{String(creator?.niche ?? "Unspecified")}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Phone Contact</span>
                          <p className="text-sm font-bold text-foreground font-mono">{String(creator?.phone ?? "N/A")}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Geographic Location</span>
                          <p className="text-sm font-bold text-foreground">{String(creator?.location ?? "N/A")}</p>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Professional Bio / Mission Statement</span>
                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium">
                          {creator?.bio ? String(creator.bio) : "No bio submitted."}
                        </p>
                      </div>

                      {/* Social Integrations */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Boolean(creator?.instagram_url) ? (
                          <a 
                            href={String(creator?.instagram_url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <Share2 className="w-5 h-5 text-pink-400" />
                              <span className="text-xs font-black text-foreground tracking-wide">Instagram Connected</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-foreground/40 group-hover:text-pink-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          </a>
                        ) : (
                          <div className="p-5 rounded-2xl bg-foreground/5 border border-border flex items-center space-x-3 opacity-50">
                            <Share2 className="w-5 h-5 text-foreground/20" />
                            <span className="text-xs font-bold text-foreground/40">Instagram Not Connected</span>
                          </div>
                        )}

                        {Boolean(creator?.youtube_url) ? (
                          <a 
                            href={String(creator?.youtube_url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-5 rounded-2xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <Share2 className="w-5 h-5 text-red-500" />
                              <span className="text-xs font-black text-foreground tracking-wide">YouTube Connected</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-foreground/40 group-hover:text-red-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          </a>
                        ) : (
                          <div className="p-5 rounded-2xl bg-foreground/5 border border-border flex items-center space-x-3 opacity-50">
                            <Share2 className="w-5 h-5 text-foreground/20" />
                            <span className="text-xs font-bold text-foreground/40">YouTube Not Connected</span>
                          </div>
                        )}
                      </div>

                      {/* Videos & Portfolio */}
                      <div className="space-y-4 pt-4 border-t border-border">
                        <h4 className="text-[11px] font-black text-foreground/40 uppercase tracking-widest flex items-center space-x-2">
                          <Video className="w-4 h-4 text-primary" />
                          <span>Uploaded Video Proofs ({videos.length})</span>
                        </h4>
                        {videos.length === 0 ? (
                          <div className="p-6 rounded-2xl bg-foreground/5 border border-border text-center text-xs text-foreground/40 font-bold uppercase tracking-wider">
                            No verification videos uploaded
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {videos.map((vidItem: unknown, i: number) => {
                              const vid = typeof vidItem === 'string' ? { url: vidItem, title: vidItem } : (vidItem as Record<string, unknown> | null);
                              return (
                                <a
                                  key={i}
                                  href={String(vid?.url ?? '#')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-4 rounded-xl bg-foreground/5 border border-border hover:border-primary/40 transition-all flex items-center space-x-3 group"
                                >
                                  <div className="p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                                    <Video className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-foreground truncate">Video Asset #{i + 1}</p>
                                    <p className="text-[10px] font-mono text-foreground/40 truncate">{String(vid?.title ?? vid?.url ?? 'View Stream')}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {portfolio.length > 0 && (
                          <div className="space-y-3 pt-3 border-t border-border">
                            <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">External Portfolio Links</span>
                            <div className="flex flex-wrap gap-2">
                              {portfolio.map((pLink: unknown, idx: number) => (
                                <a 
                                  key={idx} 
                                  href={String(pLink)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:underline flex items-center space-x-1.5"
                                >
                                  <span>{String(pLink)}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Brand Details if role = brand */}
                  {profile.role === "brand" && (
                    <div className="space-y-6 pt-4 border-t border-border">
                      <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 border-b border-border pb-3">
                        <Building2 className="w-4 h-4 text-accent-orange" />
                        <span>3. Corporate Brand KYC Data</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Company / Legal Name</span>
                          <p className="text-sm font-black text-foreground truncate">{String(brand?.company_name ?? brand?.brand_name ?? profile.full_name ?? "N/A")}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Industry Classification</span>
                          <p className="text-sm font-black text-accent-orange uppercase tracking-wider">{String(brand?.industry ?? "Commercial")}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Digital Website</span>
                          <a 
                            href={brand?.website_url ? (brand.website_url.toString().startsWith('http') ? String(brand.website_url) : `https://${brand.website_url}`) : '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-primary hover:underline flex items-center space-x-1.5 truncate"
                          >
                            <span>{String(brand?.website_url ?? "N/A")}</span>
                            {Boolean(brand?.website_url) && <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />}
                          </a>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-1">
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Corporate Phone</span>
                          <p className="text-sm font-bold text-foreground font-mono">{String(brand?.phone ?? "N/A")}</p>
                        </div>
                      </div>

                      {/* Business Description */}
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Enterprise Operations Summary</span>
                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium">
                          {brand?.business_description ? String(brand.business_description) : "No business overview provided."}
                        </p>
                      </div>

                      {/* Corporate Documents / Verification Uploads */}
                      <div className="space-y-4 pt-4 border-t border-border">
                        <h4 className="text-[11px] font-black text-foreground/40 uppercase tracking-widest flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-accent-orange" />
                          <span>Verification Documents ({docs.length})</span>
                        </h4>
                        {docs.length === 0 ? (
                          <div className="p-6 rounded-2xl bg-foreground/5 border border-border text-center text-xs text-foreground/40 font-bold uppercase tracking-wider">
                            No registration documents submitted
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {docs.map((docItem: unknown, i: number) => {
                              const doc = typeof docItem === 'string' ? { url: docItem, name: `Document #${i+1}` } : (docItem as Record<string, unknown> | null);
                              return (
                                <a
                                  key={i}
                                  href={String(doc?.url ?? '#')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-4 rounded-xl bg-foreground/5 border border-border hover:border-accent-orange/40 transition-all flex items-center space-x-3 group"
                                >
                                  <div className="p-3 rounded-lg bg-accent-orange/10 text-accent-orange flex-shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-foreground truncate">{String(doc?.name ?? `Doc #${i+1}`)}</p>
                                    <p className="text-[10px] font-mono text-foreground/40 truncate">{String(doc?.url ?? 'Download Document')}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Audit Logs / Timeline */}
                  <div className="space-y-6 pt-6 border-t border-border">
                    <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.4em] flex items-center space-x-2 mb-4">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Temporal Audit & Action Ledger</span>
                    </h3>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-surface-elevated border border-border flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-foreground">Identity Record Created</p>
                          <p className="text-[11px] font-mono text-foreground/40 mt-1">{formatDate(profile.created_at)}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-success-green flex-shrink-0" />
                      </div>

                      {Boolean(profile?.approved_at) && (
                        <div className="p-5 rounded-2xl bg-success-green/10 border border-success-green/20 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black text-success-green uppercase tracking-wider">Administrative Verification Executed</p>
                            <p className="text-[11px] font-mono text-foreground/60 mt-1">Verified at {formatDate(profile.approved_at)}</p>
                          </div>
                          <ShieldCheck className="w-5 h-5 text-success-green flex-shrink-0" />
                        </div>
                      )}

                      {logs.map((logItem: unknown, idx: number) => {
                        const log = logItem as Record<string, unknown> | null;
                        const actor = log?.actor as Record<string, unknown> | null;
                        return (
                          <div key={idx} className="p-5 rounded-2xl bg-foreground/5 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-primary uppercase tracking-wider">
                                Action: {String(log?.action ?? 'System Directive')}
                              </span>
                              <span className="text-[10px] font-mono text-foreground/40">
                                {formatDate(log?.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/80 font-medium">
                              Executed by Admin: <span className="text-foreground font-bold">{String(actor?.full_name || actor?.email || log?.actor_admin_id || "System Authority")}</span>
                            </p>
                            {Boolean(log?.metadata) && Object.keys(log?.metadata as object).length > 0 && (
                              <pre className="p-3 rounded-xl bg-background/40 border border-border text-[11px] font-mono text-foreground/60 overflow-x-auto">
                                {JSON.stringify(log?.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Verification / Approval Controls */}
            {profile && (
              <div className="p-6 border-t border-border bg-surface-elevated space-y-4 sticky bottom-0 z-20">
                {showReasonInput && (
                  <div className="space-y-2 p-4 rounded-2xl bg-background/40 border border-border animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-foreground/80 flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-accent-orange" />
                        <span>Justification Reason for {showReasonInput.toUpperCase()}</span>
                      </label>
                      <button 
                        onClick={() => setShowReasonInput(null)}
                        className="text-foreground/40 hover:text-foreground text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={`Enter reason for ${showReasonInput}...`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                    />
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleApprovalAction(showReasonInput)}
                        disabled={!reason.trim() || Boolean(actionLoading)}
                        className={cn(
                          "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-95 disabled:opacity-50",
                          showReasonInput === "blocked" ? "bg-error hover:bg-error/90" : "bg-accent-orange hover:bg-accent-orange/90"
                        )}
                      >
                        {actionLoading === showReasonInput ? "Executing..." : `Confirm ${showReasonInput.toUpperCase()}`}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {canApprove && (
                    <>
                      <button
                        onClick={() => handleApprovalAction("approved")}
                        disabled={Boolean(actionLoading) || approvalStatus === "approved"}
                        className="flex-1 min-w-[140px] h-12 rounded-2xl bg-success-green text-white text-xs font-black uppercase tracking-widest hover:bg-success-green/90 transition-all shadow-xl shadow-success-green/20 active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>{actionLoading === "approved" ? "Approving..." : "Approve"}</span>
                      </button>

                      <button
                        onClick={() => handleApprovalAction("pending_review")}
                        disabled={Boolean(actionLoading) || approvalStatus === "pending_review"}
                        className="flex-1 min-w-[140px] h-12 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2"
                      >
                        <PauseCircle className="w-4 h-4" />
                        <span>{actionLoading === "pending_review" ? "Holding..." : "Hold / Pending"}</span>
                      </button>

                      <button
                        onClick={() => handleApprovalAction("rejected")}
                        disabled={Boolean(actionLoading) || approvalStatus === "rejected"}
                        className="flex-1 min-w-[140px] h-12 rounded-2xl bg-foreground/5 border border-border text-foreground/80 hover:text-white hover:bg-error/20 hover:border-error/40 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2"
                      >
                        <Ban className="w-4 h-4 text-error" />
                        <span>{actionLoading === "rejected" ? "Rejecting..." : "Reject"}</span>
                      </button>
                    </>
                  )}

                  {canBlock && (
                    <button
                      onClick={() => handleApprovalAction("blocked")}
                      disabled={Boolean(actionLoading) || approvalStatus === "blocked"}
                      className="flex-1 min-w-[140px] h-12 rounded-2xl bg-error/10 border border-error/20 text-error text-xs font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-40 flex items-center justify-center space-x-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{actionLoading === "blocked" ? "Blocking..." : "Block"}</span>
                    </button>
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
