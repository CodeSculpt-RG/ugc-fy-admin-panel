"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2, Mail, Shield } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid admin email.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to submit request.");
        return;
      }

      setSuccessMessage(data.message || "If this email is approved, a reset link has been sent.");
    } catch (err) {
      console.error(err);
      setError("A connection error occurred. Please try again.");
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
              Forgot Password
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Enter your verified admin email address, and we&apos;ll trigger a password reset link if it is registered in our platform ledger.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="admin-email" className="text-sm font-bold text-zinc-800">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your approved email..."
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-lg transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/admin/login"
              className="text-xs font-bold text-zinc-400 hover:text-zinc-950 transition underline underline-offset-4"
            >
              Back to Login
            </Link>
          </div>
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
