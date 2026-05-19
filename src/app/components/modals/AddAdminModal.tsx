"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, ShieldAlert, Check, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
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
        : "Unable to provision admin because an unknown error occurred.";
    } catch {
      return "Unable to provision admin because the error could not be read.";
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

  const [tempCredentials, setTempCredentials] = useState<{
    email: string;
    temporaryPassword: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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
        setTempCredentials(null);
        setCopied(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid network email identifier.");
      return;
    }

    if (role === "owner" && admin?.role !== "owner") {
      setErrorMessage("Security Restriction: Only active platform owners can provision new owners.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminManagementService.createAdmin({
        email: email.trim(),
        full_name: fullName.trim() || email.split("@")[0],
        role,
        is_active: isActive,
      });

      if (res.temp_credentials) {
        setTempCredentials(res.temp_credentials);
        showToast("Admin access created successfully. Temporary credentials issued.", "success");
      } else {
        if (res.warning) {
          showToast(String(res.warning), "warning");
        } else {
          showToast("Admin access created successfully.", "success");
        }
        onSuccess?.();
        onClose();
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      showToast(message, "error");
      console.error("[ProvisionAdminModal] Failed to provision admin:", {
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (!tempCredentials) return;
    navigator.clipboard.writeText(tempCredentials.temporaryPassword);
    setCopied(true);
    showToast("Password copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuccessClose = () => {
    setTempCredentials(null);
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
            onClick={tempCredentials ? handleSuccessClose : onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md z-[200]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-[201] w-full max-w-[540px] max-h-[90vh] bg-[#0F172A] border border-white/10 rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/50 to-transparent" />

            <button
              onClick={tempCredentials ? handleSuccessClose : onClose}
              className="absolute right-6 top-6 p-2 rounded-2xl bg-white/[0.03] border border-white/5 text-[#F0F0FB]/40 hover:text-white hover:bg-white/10 transition-all z-20 outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {tempCredentials ? (
              /* Success Credentials View */
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-6">
                <div className="flex flex-col items-center text-center space-y-4 border-b border-white/[0.05] pb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-[#F0F0FB] tracking-tight uppercase">Credentials Generated</h3>
                  <p className="text-xs text-[#F0F0FB]/40 font-medium">Please copy these credentials safely. The password will not be shown again.</p>
                </div>

                <div className="space-y-4 font-medium text-sm">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                    <div>
                      <span className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.2em] block mb-1">Assigned Email</span>
                      <p className="text-sm font-semibold text-white">{tempCredentials.email}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.2em] block mb-1">Temporary Password</span>
                      <div className="flex items-center justify-between gap-3 mt-1.5">
                        <code className="bg-[#0b0e14] px-3 py-2 rounded-xl text-sm font-mono text-emerald-400 border border-white/5 break-all select-all flex-1">
                          {tempCredentials.temporaryPassword}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-emerald-400 transition-all hover:scale-105 shrink-0"
                          title="Copy Password"
                        >
                          {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.2em] block mb-1">Security Role</span>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary-blue/15 border border-primary-blue/20 text-xs font-black uppercase text-primary-blue tracking-wider">
                        {tempCredentials.role.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-accent-orange/5 border border-accent-orange/10 flex items-start gap-3">
                    <ShieldAlert className="w-4.5 h-4.5 text-accent-orange shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black text-accent-orange uppercase tracking-wider block">First Login Obligation</span>
                      <p className="text-[11px] text-[#F0F0FB]/60 mt-1 leading-relaxed">
                        The appointed operator will be prompted to replace this temporary credential immediately upon logging into the UGC FY Admin Panel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleSuccessClose}
                    className="w-full h-14 rounded-[20px] bg-primary-blue hover:bg-primary-blue/90 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all"
                  >
                    Close & Sync
                  </Button>
                </div>
              </div>
            ) : (
              /* Provision Form View */
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-6">
                <div className="flex items-center space-x-4 border-b border-white/[0.05] pb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 border border-primary-blue/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-blue/10">
                    <UserPlus className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#F0F0FB] tracking-tight uppercase">Provision Administrator</h3>
                    <p className="text-xs text-[#F0F0FB]/40 font-medium mt-1">Configure security role and access vector for a new network operator.</p>
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
                    <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block mb-2">Network Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@ugc-fy.in"
                      className="w-full h-13 rounded-2xl bg-white/[0.02] border border-white/[0.08] px-4 text-sm text-[#F0F0FB] focus:outline-none focus:border-primary-blue/40 focus:ring-2 focus:ring-primary-blue/20 transition-all placeholder:text-[#F0F0FB]/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block mb-2">Operator Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-13 rounded-2xl bg-white/[0.02] border border-white/[0.08] px-4 text-sm text-[#F0F0FB] focus:outline-none focus:border-primary-blue/40 focus:ring-2 focus:ring-primary-blue/20 transition-all placeholder:text-[#F0F0FB]/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block mb-2">Access Role Vector *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-13 rounded-2xl bg-[#111827] border border-white/[0.08] px-4 text-sm text-[#F0F0FB] focus:outline-none focus:border-primary-blue/40 focus:ring-2 focus:ring-primary-blue/20 transition-all cursor-pointer font-semibold uppercase tracking-wider text-xs"
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
                    <label className="flex items-center space-x-3 cursor-pointer group p-3 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.05] transition-colors">
                      <div className={cn("w-5 h-5 rounded-lg border flex items-center justify-center transition-all", isActive ? "bg-success-green border-success-green text-white" : "border-white/20 bg-transparent")}>
                        {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only"
                      />
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-[#F0F0FB]">Active Operational State</span>
                        <p className="text-[10px] text-[#F0F0FB]/40">Instantly grant administrative token access upon provision completion.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/[0.05] w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-14 bg-transparent border-white/10 text-[#F0F0FB]/60 hover:text-[#F0F0FB] hover:bg-white/[0.04] rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-14 rounded-[20px] bg-primary-blue hover:bg-primary-blue/90 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.98] shadow-xl shadow-primary-blue/20"
                  >
                    {loading ? "PROVISIONING..." : "PROVISION ADMIN"}
                  </Button>
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
