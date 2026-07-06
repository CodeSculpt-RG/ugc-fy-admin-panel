"use client";

import React, { useState } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useToast } from "@/app/hooks/useToast";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function AdminSecuritySettingsPage() {
  const { admin, session, refreshAdmin } = useAdminAuth();
  const { showToast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(admin?.password_enabled || false);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[a-zA-Z]/.test(pass)) return "Password must contain at least one letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    return null;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validatePassword(password);
    if (errorMsg) {
      showToast(errorMsg, "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Update password in Supabase Auth
      const { error: supabaseErr } = await supabaseBrowserClient.auth.updateUser({
        password: password,
      });

      if (supabaseErr) {
        showToast(`Supabase update failed: ${supabaseErr.message}`, "error");
        setLoading(false);
        return;
      }

      // 2. Enable password option on our backend
      const response = await fetch("/api/admin/auth/enable-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        showToast("Password updated, but failed to enable password login parameter.", "warning");
      } else {
        showToast("Administrative password successfully established and enabled.", "success");
        setPassword("");
        setConfirmPassword("");
        setPasswordEnabled(true);
        await refreshAdmin(true);
      }
    } catch {
      showToast("Security update execution failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordLogin = async () => {
    setLoading(true);
    const apiPath = passwordEnabled
      ? "/api/admin/auth/disable-password"
      : "/api/admin/auth/enable-password";
    
    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        showToast("Failed to toggle password login option.", "error");
      } else {
        const nextState = !passwordEnabled;
        setPasswordEnabled(nextState);
        showToast(
          nextState
            ? "Password login vector enabled."
            : "Password login vector disabled. You must login via Google or OTP.",
          "success"
        );
        await refreshAdmin(true);
      }
    } catch {
      showToast("Security toggle failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader
          title="Security Management"
          subtitle="Configure enterprise authentication methods, password policies, and credentials vectors."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card-bg border border-border rounded-[32px] p-8 shadow-premium space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight mb-2">Establish Password Vector</h3>
              <p className="text-xs text-foreground/40 leading-relaxed">
                Define a strong secondary password. This option requires 8+ characters, one letter, and one number.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min. 8 characters"
                      className="w-full h-14 bg-surface-elevated border border-border rounded-xl px-5 text-foreground text-[13px] font-bold tracking-tight focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-foreground/20 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Match passwords"
                    className="w-full h-14 bg-surface-elevated border border-border rounded-xl px-5 text-foreground text-[13px] font-bold tracking-tight focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-14 px-8 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center space-x-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Save Password</span>
              </button>
            </form>
          </div>

          <div className="bg-card-bg border border-border rounded-[32px] p-8 shadow-premium space-y-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-orange/30 to-transparent" />
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-md font-black text-foreground tracking-tight leading-none mt-4">Password Login Option</h3>
              <p className="text-xs text-foreground/40 leading-relaxed">
                Enable or disable the password authentication vector on your login page. When disabled, this email can only log in via OAuth (Google) or email OTP.
              </p>
            </div>

            <div className="pt-6 border-t border-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className={`w-5 h-5 ${passwordEnabled ? "text-success-green" : "text-foreground/10"}`} />
                <span className="text-xs font-bold text-foreground">
                  {passwordEnabled ? "Status: Enabled" : "Status: Disabled"}
                </span>
              </div>
              <button
                onClick={handleTogglePasswordLogin}
                disabled={loading}
                className={`h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                  passwordEnabled
                    ? "bg-error/10 border border-error/20 text-error hover:bg-error/20"
                    : "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
                }`}
              >
                {passwordEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
