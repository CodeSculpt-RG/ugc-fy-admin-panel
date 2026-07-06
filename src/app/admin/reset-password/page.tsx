"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import { supabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // 1. Double check we have a session to proceed (Supabase sets recovery session on page load automatically)
    const checkSession = async () => {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      if (!session) {
        // If no session found in URL hash/cookie, warn the user.
        console.warn("[ResetPassword] No recovery session found in client environment.");
      }
    };
    void checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Update the password in Supabase Auth
      const { data, error: authError } = await supabaseBrowserClient.auth.updateUser({
        password: password,
      });

      if (authError || !data.user) {
        setError(authError?.message || "Failed to update auth password.");
        setLoading(false);
        return;
      }

      // 2. Call enable-password endpoint to set password_enabled to true in database
      const accessToken = (await supabaseBrowserClient.auth.getSession()).data.session?.access_token;

      if (!accessToken) {
        setError("Session expired. Please request another reset link.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/auth/enable-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const enableData = await response.json();

      if (!response.ok || !enableData.success) {
        console.warn("Could not auto-enable password in admin ledger, but auth password was set.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login?setup=success");
      }, 2000);
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 lg:grid lg:grid-cols-[40%_60%]">
      <section className="flex min-h-screen w-full flex-col items-center justify-center px-5 py-8 sm:px-8 lg:px-10 xl:px-14">
        <div className="w-full max-w-[430px]">
          {/* Logo Section */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl shadow-orange-900/10">
              <Shield className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-base font-black tracking-tight">UGCFY</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                Admin Console
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">
              Reset Password
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Configure a strong, new password for your administrator account.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>Password reset successfully. Redirecting you to login...</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-bold text-zinc-800">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters..."
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-12 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-bold text-zinc-800">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password..."
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-lg transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 pt-1"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Decorative side panel */}
      <section className="hidden min-h-screen bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500">
            System Perimeter
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="max-w-[480px]">
          <h2 className="text-4xl font-black leading-tight tracking-tight text-white">
            Secure Platform Control Layer
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Administrator access credentials require multi-factor verification. Session tracking, activity logging, and security perimeter rules remain active.
          </p>
        </div>
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <span>UGC FY © 2026</span>
          <span>Security logs active</span>
        </div>
      </section>
    </div>
  );
}
