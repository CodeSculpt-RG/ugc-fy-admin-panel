"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { supabase } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Lock, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/admin/login");
    } else if (!user.mustChangePassword) {
      router.replace("/admin/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      });

      if (authError) throw authError;

      // 2. Update must_change_password status in the database
      const { error: dbError } = await supabase
        .from("admin_profiles")
        .update({
          must_change_password: false,
          password_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (dbError) throw dbError;

      setSuccess(true);

      // 3. Update the local authStore state to unlock layout guard
      if (user && token) {
        const updatedUser = {
          ...user,
          mustChangePassword: false,
        };
        setAuth(updatedUser, token);
      }

      setTimeout(() => {
        router.replace("/admin/dashboard");
      }, 1500);
    } catch (err: unknown) {
      const errorRecord = err as Record<string, unknown>;
      setError(String(errorRecord.message || "Failed to update security credentials."));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden px-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl p-8 shadow-2xl relative"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-accent-orange/15 border border-accent-orange/30 flex items-center justify-center text-accent-orange mb-4">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Security Credential Update
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
            You are logged in with temporary credentials. Please set a new secure password to proceed.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3"
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>Credentials updated successfully! Redirecting you to the dashboard...</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || success}
              placeholder="••••••••••••"
              className="w-full bg-background/50 border border-border/60 hover:border-border focus:border-primary rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || success}
              placeholder="••••••••••••"
              className="w-full bg-background/50 border border-border/60 hover:border-border focus:border-primary rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors duration-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-border border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Activate Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
