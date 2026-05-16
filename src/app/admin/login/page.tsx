"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { adminService } from "@/app/services/systemServices";
import { useAuthStore } from "@/app/store/authStore";


const loginSchema = z.object({
  email: z.string().email("Invalid enterprise email"),
  password: z.string().min(6, "Security protocol requires 6+ characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      const { token, admin } = await adminService.login(data.email, data.password);
      
      setCookie("admin-token", token, { maxAge: 60 * 60 * 12 }); // 12h
      setAuth(admin, token);
      
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Authentication protocol failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 selection:bg-primary-blue/30 selection:text-primary-blue">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.1),transparent_50%)]" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-primary-blue/10 rounded-[30px] border border-primary-blue/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-blue/10 animate-pulse">
            <Shield className="w-10 h-10 text-primary-blue" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-4">AUTHENTICATION</h1>
          <p className="text-[#F0F0FB]/30 text-[10px] font-black uppercase tracking-[0.4em]">UGC FY Enterprise Operations</p>
        </div>

        <div className="bg-[#0F172A] border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/30 to-transparent" />
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-blue text-[#F0F0FB]/20">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  {...register("email")}
                  placeholder="Enterprise Identifier"
                  className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 pr-6 text-[#F0F0FB] text-[13px] font-black tracking-tight focus:outline-none focus:border-primary-blue/50 focus:bg-white/[0.04] transition-all placeholder:text-[#F0F0FB]/10 shadow-inner"
                />
                {errors.email && (
                  <p className="mt-2 text-[10px] font-black text-error uppercase tracking-widest ml-1">{errors.email.message}</p>
                )}
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-blue text-[#F0F0FB]/20">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Security Credential"
                  className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 pr-6 text-[#F0F0FB] text-[13px] font-black tracking-tight focus:outline-none focus:border-primary-blue/50 focus:bg-white/[0.04] transition-all placeholder:text-[#F0F0FB]/10 shadow-inner"
                />
                {errors.password && (
                  <p className="mt-2 text-[10px] font-black text-error uppercase tracking-widest ml-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0" />
                <p className="text-[11px] font-black text-error uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary-blue text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Access"}
            </button>
          </form>
        </div>

        <div className="mt-12 pt-12 border-t border-white/5 text-center">
          <p className="text-[9px] font-black text-[#F0F0FB]/20 uppercase tracking-[0.3em] leading-relaxed max-w-[300px] mx-auto">
            Restricted System. Unauthorized access attempts are monitored and recorded under security protocol 14-B.
          </p>
        </div>
      </div>
    </div>
  );
}
