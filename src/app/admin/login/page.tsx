"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Lock, Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { adminService } from "@/app/services/systemServices";
import { useAuthStore } from "@/app/store/authStore";


const TEXT = {
  invalidEmail: "Invalid enterprise email",
  invalidPassword: "Security protocol requires 6+ characters",
  loginTitle: "Admin Login",
  platformName: "UGC FY Platform",
  setupSuccess: "Admin password created successfully. You can now login to the UGC FY Admin Panel.",
  emailPlaceholder: "Enterprise Identifier",
  passwordPlaceholder: "Security Credential",
  authFailed: "Authentication protocol failed",
  authorize: "Authorize Access",
  footerText: "Restricted System. Unauthorized access attempts are monitored and recorded under security protocol 14-B.",
};

const loginSchema = z.object({
  email: z.string().email(TEXT.invalidEmail),
  password: z.string().min(6, TEXT.invalidPassword),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("setup") === "success") {
        setTimeout(() => {
          setSetupSuccess(true);
        }, 0);
      }
    }
  }, []);

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
      
      if (admin.mustChangePassword) {
        router.push("/admin/force-password-change");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : TEXT.authFailed;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const { name: emailName, ref: emailRef, onChange: emailOnChange, onBlur: emailOnBlur } = register("email");
  const { name: passwordName, ref: passwordRef, onChange: passwordOnChange, onBlur: passwordOnBlur } = register("password");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 selection:bg-primary/30 selection:text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.1),transparent_50%)]" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-[30px] border border-primary/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/10 animate-pulse">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">{TEXT.loginTitle}</h1>
          <p className="text-text-secondary text-sm font-semibold uppercase tracking-widest">{TEXT.platformName}</p>
        </div>

        {setupSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-success-green/10 border border-success-green/20 flex items-center space-x-3 shadow-md shadow-success-green/5">
            <CheckCircle className="w-5 h-5 text-success-green shrink-0" />
            <p className="text-[11px] font-black text-success-green uppercase tracking-widest leading-normal">
              {TEXT.setupSuccess}
            </p>
          </div>
        )}

        <div className="bg-card-bg border border-border rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-foreground/20">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  name={emailName}
                  ref={emailRef}
                  onChange={emailOnChange}
                  onBlur={emailOnBlur}
                  placeholder={TEXT.emailPlaceholder}
                  className="w-full h-16 bg-surface-elevated border border-border rounded-2xl pl-14 pr-6 text-foreground text-[13px] font-black tracking-tight focus:outline-none focus:border-primary/50 focus:bg-surface-elevated hover:bg-foreground/5 transition-all placeholder:text-foreground/10 shadow-inner"
                />
                {errors.email && (
                  <p className="mt-2 text-[10px] font-black text-error uppercase tracking-widest ml-1">{errors.email.message}</p>
                )}
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-foreground/20">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  name={passwordName}
                  ref={passwordRef}
                  onChange={passwordOnChange}
                  onBlur={passwordOnBlur}
                  type="password"
                  placeholder={TEXT.passwordPlaceholder}
                  className="w-full h-16 bg-surface-elevated border border-border rounded-2xl pl-14 pr-6 text-foreground text-[13px] font-black tracking-tight focus:outline-none focus:border-primary/50 focus:bg-surface-elevated hover:bg-foreground/5 transition-all placeholder:text-foreground/10 shadow-inner"
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
              className="w-full h-16 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : TEXT.authorize}
            </button>
          </form>
        </div>

        <div className="mt-12 pt-12 border-t border-border text-center">
          <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em] leading-relaxed max-w-[300px] mx-auto">
            {TEXT.footerText}
          </p>
        </div>
      </div>
    </div>
  );
}
