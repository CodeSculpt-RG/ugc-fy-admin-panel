"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Mock login flow with specific credentials
    setTimeout(() => {
      if (email === "admin@ugc-fy.in" && password === "admin@2026") {
        setLoading(false);
        router.push("/admin/dashboard");
      } else {
        setLoading(false);
        setError("Invalid administrator credentials. Access denied.");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-orange/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="bg-dark-surface/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-primary-blue to-accent-orange rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-blue/20"
            >
              <Lock className="text-white w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-bold text-soft-white tracking-tight">
              UGC FY <span className="text-primary-blue">Admin</span>
            </h1>
            <p className="text-soft-white/60 mt-2 text-sm">
              Restricted access for authorized administrators only.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center space-x-3"
            >
              <ShieldAlert className="w-5 h-5 text-error shrink-0" />
              <p className="text-xs font-bold text-error">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-soft-white/50 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soft-white/30 group-focus-within:text-primary-blue transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ugc-fy.in"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-soft-white placeholder:text-soft-white/20 focus:outline-none focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-soft-white/50 uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary-blue hover:text-primary-blue/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soft-white/30 group-focus-within:text-primary-blue transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-soft-white placeholder:text-soft-white/20 focus:outline-none focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-soft-white/30 hover:text-soft-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-blue/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Secure Login</span>
                  <ShieldAlert className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center space-x-4">
            <span className="text-[10px] text-soft-white/30 uppercase tracking-[0.2em]">
              All attempts are monitored
            </span>
          </div>
        </div>

        <p className="text-center mt-8 text-soft-white/20 text-xs">
          © 2026 UGC FY Ecosystem. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
