"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, ShieldAlert, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { adminManagementService } from "@/app/services/adminManagementService";
import { useToast } from "@/app/hooks/useToast";

export interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    if (typeof record.details === "string") return record.details;

    try {
      const serialized = JSON.stringify(error);
      return serialized && serialized !== "{}"
        ? serialized
        : "Unable to provision admin because an unknown error object was received.";
    } catch {
      return "Unable to provision admin because the error could not be serialized.";
    }
  }

  return String(error || "Unable to provision admin.");
}

export function AddAdminModal({ isOpen, onClose, onSuccess }: AddAdminModalProps) {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support_admin");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showLinkOption, setShowLinkOption] = useState(false);

  const [resendTargetId, setResendTargetId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        setFullName("");
        setEmail("");
        setRole("support_admin");
        setIsActive(true);
        setErrorMessage(null);
        setIsSuccess(false);
        setResendTargetId(null);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const handleResendInvite = async () => {
    if (!resendTargetId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await adminManagementService.resendInvite(resendTargetId);
      
      if (!response.success && !response.ok) {
        const errCode = response.error?.code;
        if (errCode === 'INVITE_RESEND_COOLDOWN') {
          setErrorMessage("An invite was sent recently. Please wait before trying again.");
        } else if (errCode === 'SUPABASE_EMAIL_RATE_LIMITED') {
          setErrorMessage("Supabase email rate limit reached. Wait or configure SMTP.");
        } else if (errCode === 'SUPABASE_REDIRECT_URL_NOT_ALLOWED') {
          setErrorMessage("Supabase redirect URL is not configured.");
        } else if (errCode === 'SUPABASE_EMAIL_PROVIDER_FAILED') {
          setErrorMessage("Supabase email provider failed. Check SMTP/Auth email settings.");
        } else if (errCode === 'SUPABASE_INVITE_NOT_SENT_EXISTING_USER') {
          setErrorMessage("Supabase did not send another invite because this email already belongs to an existing Auth user. Link existing user as admin or use another email.");
          setShowLinkOption(true);
        } else if (errCode === 'SUPABASE_INVITE_TIMEOUT') {
          setErrorMessage("Supabase invite request timed out. Please try again.");
        } else if (errCode === 'SUPABASE_INVITE_FAILED') {
          setErrorMessage(`Supabase invite failed: ${response.error?.message || 'Unknown error'}`);
        } else {
          setErrorMessage(response.error?.message || "An expected error occurred.");
        }
        return;
      }

      setIsSuccess(true);
      showToast("Invitation email resent successfully.", "success");
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      console.error(`[ProvisionAdminModal] Failed to resend invite: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkExistingUser = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await adminManagementService.linkExistingAdmin({
        email: email.trim(),
        full_name: fullName.trim() || email.split("@")[0],
        role,
      });
      setIsSuccess(true);
      showToast("Admin profile linked successfully. Setup instructions dispatched.", "success");
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      console.error(`[ProvisionAdminModal] Failed to link existing admin: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowLinkOption(false);

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid network email identifier.");
      return;
    }

    if (role === "owner" && admin?.role !== "owner") {
      setErrorMessage("Security Restriction: Only active platform owners can provision new owners.");
      return;
    }

    setLoading(true);
    setResendTargetId(null);
    try {
      const response = await adminManagementService.createAdmin({
        email: email.trim(),
        full_name: fullName.trim() || email.split("@")[0],
        role,
        is_active: isActive,
      });

      if (!response.ok) {
        // Handle expected errors returned as response
        const errCode = response.error?.code;
        const details = response.error?.details as Record<string, unknown> | undefined;
        const targetId = typeof details?.adminId === "string" ? details.adminId : null;

        if (errCode === 'ADMIN_ALREADY_EXISTS') {
          setErrorMessage("This email is already an active admin.");
        } else if (errCode === 'ADMIN_INVITE_ALREADY_PENDING') {
          setErrorMessage("An invite is already pending for this email.");
          if (targetId) setResendTargetId(targetId);
        } else if (errCode === 'ADMIN_INVITE_FAILED_RETRY_AVAILABLE') {
          setErrorMessage("Previous invite failed. You can retry.");
          if (targetId) setResendTargetId(targetId);
        } else if (errCode === 'AUTH_USER_ALREADY_EXISTS') {
          setErrorMessage("A Supabase account already exists for this email. Link existing user as admin or use another email.");
          setShowLinkOption(true);
        } else if (errCode === 'ADMIN_REVOKED_REQUIRES_REACTIVATION') {
          setErrorMessage("This admin was revoked and requires explicit reactivation.");
        } else if (errCode === 'SUPABASE_INVITE_FAILED') {
          setErrorMessage(`Supabase invite failed: ${response.error?.message || 'Unknown error'}`);
        } else if (errCode === 'SUPABASE_INVITE_TIMEOUT') {
          setErrorMessage("Supabase invite request timed out. Please try again.");
        } else if (errCode === 'INVITE_RESEND_COOLDOWN') {
          setErrorMessage("An invite was sent recently. Please wait before trying again.");
        } else if (errCode === 'SUPABASE_EMAIL_RATE_LIMITED') {
          setErrorMessage("Supabase email rate limit reached. Wait or configure SMTP.");
        } else if (errCode === 'SUPABASE_REDIRECT_URL_NOT_ALLOWED') {
          setErrorMessage("Supabase redirect URL is not configured.");
        } else if (errCode === 'SUPABASE_EMAIL_PROVIDER_FAILED') {
          setErrorMessage("Supabase email provider failed. Check SMTP/Auth email settings.");
        } else if (errCode === 'SUPABASE_INVITE_NOT_SENT_EXISTING_USER') {
          setErrorMessage("Supabase did not send another invite because this email already belongs to an existing Auth user. Link existing user as admin or use another email.");
          setShowLinkOption(true);
        } else {
          setErrorMessage(response.error?.message || "An expected error occurred.");
        }
        return;
      }

      setIsSuccess(true);
      showToast("Admin access created successfully. Invitation email has been sent.", "success");
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      console.error(`[ProvisionAdminModal] Failed to provision admin: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccess(false);
    onSuccess?.();
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSuccess ? handleSuccessClose : onClose}
            className="absolute inset-0 bg-background/70 backdrop-blur-md z-[200]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-[201] w-full max-w-[540px] max-h-[90vh] bg-card-bg border border-border rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <button
              onClick={isSuccess ? handleSuccessClose : onClose}
              className="absolute right-6 top-6 p-2 rounded-2xl bg-surface-elevated border border-border text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all z-20 outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              /* Success Redirection Information View */
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-6">
                <div className="flex flex-col items-center text-center space-y-4 border-b border-border pb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Invitation Dispatched</h3>
                  <p className="text-xs text-foreground/40 font-medium">Administrator access granted successfully.</p>
                </div>

                <div className="space-y-4 font-medium text-sm">
                  <div className="p-5 rounded-2xl bg-surface-elevated border border-border space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] block mb-1">Target Account</span>
                      <p className="text-sm font-semibold text-foreground">{email}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] block mb-1">Assigned Vector</span>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/20 text-xs font-black uppercase text-primary tracking-wider">
                        {role.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] block mb-1">Status</span>
                      <p className="text-xs text-foreground/60 leading-relaxed font-semibold">
                        A Supabase invitation email has been sent automatically. The new admin will complete setup using the invite link.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-accent-orange/5 border border-accent-orange/10 flex items-start gap-3">
                    <ShieldAlert className="w-4.5 h-4.5 text-accent-orange shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black text-accent-orange uppercase tracking-wider block">Security Protocol</span>
                      <p className="text-[11px] text-foreground/60 mt-1 leading-relaxed">
                        The newly appointed admin must complete setup using the invite link and must finish password setup before accessing the dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleSuccessClose}
                    className="w-full h-14 rounded-[20px] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] text-[11px] transition-all"
                  >
                    Close & Sync
                  </Button>
                </div>
              </div>
            ) : (
              /* Provision Form View */
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-6">
                <div className="flex items-center space-x-4 border-b border-border pb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/10">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Provision Administrator</h3>
                    <p className="text-xs text-foreground/40 font-medium mt-1">Configure security role and access vector for a new network operator.</p>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="p-4 rounded-2xl bg-accent-orange/10 border border-accent-orange/20 flex items-center space-x-3 text-accent-orange text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <div className="space-y-4 font-medium text-sm">
                  <div>
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block mb-2">Network Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@ugc-fy.in"
                      className="w-full h-13 rounded-2xl bg-surface-elevated border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-foreground/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block mb-2">Operator Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-13 rounded-2xl bg-surface-elevated border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-foreground/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block mb-2">Access Role Vector *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-13 rounded-2xl bg-surface border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-semibold uppercase tracking-wider text-xs"
                    >
                      <option value="owner" disabled={admin?.role !== "owner"}>Owner (Root Access)</option>
                      <option value="super_admin">Super Admin (All Vectors)</option>
                      <option value="moderation_admin">Moderation Admin (Content & Safety)</option>
                      <option value="finance_admin">Finance Admin (Treasury & Payouts)</option>
                      <option value="support_admin">Support Admin (Disputes & Tickets)</option>
                      <option value="analyst">Analyst (Metrics & Intelligence)</option>
                    </select>
                    {role === "owner" && admin?.role !== "owner" && (
                      <p className="text-[11px] text-accent-orange font-semibold mt-2 px-2 flex items-center space-x-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Only active platform owners can assign the Owner vector.</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <div className="mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start space-x-3 text-primary text-xs font-semibold">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>A Supabase invitation email will be sent automatically. The new admin will complete setup using the invite link and must finish password setup before accessing the dashboard.</span>
                    </div>

                    <label className="flex items-center space-x-3 cursor-pointer group p-3 rounded-2xl bg-white/[0.01] hover:bg-surface-elevated border border-border transition-colors">
                      <div className={cn("w-5 h-5 rounded-lg border flex items-center justify-center transition-all", isActive ? "bg-success-green border-success-green text-primary-foreground" : "border-border bg-transparent")}>
                        {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only"
                      />
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-foreground">Active Operational State</span>
                        <p className="text-[10px] text-foreground/40">Instantly grant administrative token access upon provision completion.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-14 bg-transparent border-border text-foreground/60 hover:text-foreground hover:bg-surface-elevated hover:bg-foreground/5 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px]"
                  >
                    Cancel
                  </Button>
                  
                  {resendTargetId ? (
                    <Button
                      type="button"
                      onClick={handleResendInvite}
                      disabled={loading}
                      className="flex-1 h-14 rounded-[20px] bg-accent-orange hover:bg-accent-orange/90 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.98] shadow-xl shadow-accent-orange/20"
                    >
                      {loading ? "RESENDING..." : "RESEND INVITE"}
                    </Button>
                  ) : showLinkOption ? (
                    <Button
                      type="button"
                      onClick={handleLinkExistingUser}
                      disabled={loading}
                      className="flex-1 h-14 rounded-[20px] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20"
                    >
                      {loading ? "LINKING..." : "LINK EXISTING USER"}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-14 rounded-[20px] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.98] shadow-xl shadow-primary/20"
                    >
                      {loading ? "PROVISIONING..." : "PROVISION ADMIN"}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
