"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

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
        : "Unable to complete password setup because an unknown error occurred.";
    } catch {
      return "Unable to complete password setup because the error could not be read.";
    }
  }

  return String(error || "Unable to complete password setup.");
}

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if recovery/reset token exists in URL or if session is active
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !window.location.hash.includes("access_token=")) {
        setError("Setup Session Expired: Please request a new setup link from your platform owner.");
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Security protocol requires a minimum of 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Security Credentials do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();

      if (user?.id) {
        await supabase
          .from("admin_profiles")
          .update({
            password_setup_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      await supabase.auth.signOut();

      setSuccess(true);
      setTimeout(() => {
        router.replace("/admin/login?setup=success");
      }, 2000);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 selection:bg-primary/30 selection:text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.1),transparent_50%)]" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-[30px] border border-primary/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/10 animate-pulse">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">Create Your Admin Password</h1>
          <p className="text-foreground/40 text-xs font-medium max-w-[340px] mx-auto leading-relaxed">
            You have been granted access to the UGC FY Admin Panel. Create a secure password to activate your admin login.
          </p>
        </div>

        <div className="bg-card-bg border border-border rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-success-green/10 rounded-full border border-success-green/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success-green" />
              </div>
              <h3 className="text-lg font-black text-foreground uppercase tracking-wider">Access Activated</h3>
              <p className="text-xs text-foreground/40">Your admin credentials have been successfully updated. Redirecting to authorization portal...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6 font-medium text-sm">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-foreground/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Secure Password (8+ chars)"
                    className="w-full h-16 bg-surface-elevated border border-border rounded-2xl pl-14 pr-6 text-foreground text-[13px] font-black tracking-tight focus:outline-none focus:border-primary/50 focus:bg-surface-elevated hover:bg-foreground/5 transition-all placeholder:text-foreground/10 shadow-inner"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-foreground/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Secure Password"
                    className="w-full h-16 bg-surface-elevated border border-border rounded-2xl pl-14 pr-6 text-foreground text-[13px] font-black tracking-tight focus:outline-none focus:border-primary/50 focus:bg-surface-elevated hover:bg-foreground/5 transition-all placeholder:text-foreground/10 shadow-inner"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <p className="text-[11px] font-black text-error uppercase tracking-widest leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Activate Admin Access"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 pt-12 border-t border-border text-center">
          <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em] leading-relaxed max-w-[300px] mx-auto">
            Authorized Platform operators only. All setup steps are digitally signed and audited.
          </p>
        </div>
      </div>
    </div>
  );
}
