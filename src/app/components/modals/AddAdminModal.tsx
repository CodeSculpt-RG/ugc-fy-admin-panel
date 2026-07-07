"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
      setSuccessMessage(response.message || "Admin access created successfully. Invitation email has been sent.");
      showToast(response.message || "Admin access created successfully. Invitation email has been sent.", "success");
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
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Admin invited successfully.</h3>
                </div>

                <div className="space-y-4 font-medium text-sm">
                  <div className="p-5 rounded-2xl bg-surface-elevated border border-border space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] block mb-1">Target Account</span>
                      <p className="text-sm font-semibold text-foreground">{email}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-foreground/60 block mb-1">Assigned Role</span>
                      <span className="inline-block px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-800 capitalize">
                        {role.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {successMessage || "An invitation email will be sent to this admin. They can sign in after accepting the invite or using the admin login flow."}
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
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-5 h-5 text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Add Admin</h3>
                    <p className="text-sm text-foreground/60 mt-1">Invite a team member and assign their admin role.</p>
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
                    <label className="text-sm font-semibold text-zinc-800 block mb-1.5">Email address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full h-11 rounded-xl bg-white border border-zinc-200 px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-zinc-800 block mb-1.5">Full name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-11 rounded-xl bg-white border border-zinc-200 px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-zinc-800 block mb-1.5">Role *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white border border-zinc-200 px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-sm cursor-pointer"
                    >
                      <option value="owner" disabled={admin?.role !== "owner"}>Owner</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="moderation_admin">Moderation Admin</option>
                      <option value="finance_admin">Finance Admin</option>
                      <option value="support_admin">Support Admin</option>
                      <option value="analyst">Analyst</option>
                    </select>
                    {role === "owner" && admin?.role !== "owner" && (
                      <p className="text-[11px] text-accent-orange font-semibold mt-2 px-2 flex items-center space-x-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Only active platform owners can assign the Owner vector.</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start space-x-3 text-blue-800 text-sm">
                      <span>An invitation email will be sent to this admin. They can sign in after accepting the invite or using the admin login flow.</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-11 bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-semibold text-sm"
                  >
                    Cancel
                  </Button>
                  
                  {resendTargetId ? (
                    <Button
                      type="button"
                      onClick={handleResendInvite}
                      disabled={loading}
                      className="flex-1 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition-all shadow-sm"
                    >
                      {loading ? "Resending..." : "Resend Invite"}
                    </Button>
                  ) : showLinkOption ? (
                    <Button
                      type="button"
                      onClick={handleLinkExistingUser}
                      disabled={loading}
                      className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm"
                    >
                      {loading ? "Linking..." : "Link Existing User"}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-sm"
                    >
                      {loading ? "Sending..." : "Send Invite"}
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
