"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import DashboardShell from "@/app/components/layout/DashboardShell";
import AdminLoginPage from "./login/page";
import { Loader2 } from "lucide-react";

const TEXT = {
  securingConnection: "Securing Connection",
} as const;

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/\/$/, "");
  const router = useRouter();
  const { admin, loading, status, refreshAdmin } = useAdminAuth();
  
  // Mounted flag to ensure we don't render client-specific states during SSR first pass
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!admin || !mounted) return;
    
    const needsSetup = admin.mustChangePassword || admin.inviteStatus === "pending";
    if (needsSetup && normalizedPath !== "/admin/force-password-change") {
      router.replace("/admin/force-password-change");
    }
  }, [admin, normalizedPath, router, mounted]);

  const publicRoutes = [
    "/admin/login",
    "/admin/auth/callback",
    "/admin/forgot-password",
    "/admin/reset-password",
    "/admin/setup-password"
  ];

  const isPublicRoute = publicRoutes.includes(normalizedPath);

  // 1. Initial stable render during SSR (both server and first client render see this)
  if (!mounted || loading) {
    return (
      <main 
        suppressHydrationWarning
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden"
      >
        <section suppressHydrationWarning className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.08),transparent_50%)] animate-pulse" />
        <article suppressHydrationWarning className="relative z-10 flex flex-col items-center">
          <span suppressHydrationWarning className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center mb-6 shadow-glow animate-pulse block">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </span>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 animate-pulse">
            {TEXT.securingConnection}
          </p>
        </article>
      </main>
    );
  }

  // 2. Public Auth pages bypass auth and shell checks
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!admin && status === "unknown") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center mb-6 shadow-glow">
          <Loader2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-black text-foreground tracking-tight mb-2">
          Session Verification Delayed
        </h1>
        <p className="text-sm text-text-secondary max-w-md leading-relaxed mb-8">
          The admin session could not be verified because the network request was interrupted. Your session was not cleared.
        </p>
        <button
          onClick={() => void refreshAdmin(true)}
          className="h-12 px-8 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95"
        >
          Retry Verification
        </button>
      </main>
    );
  }

  // 3. Strict Layout Guard: If not authenticated, render login page
  if (!admin) {
    return <AdminLoginPage />;
  }

  // 4. Force password setup bypasses the shell
  if (normalizedPath === "/admin/force-password-change") {
    return <>{children}</>;
  }

  // 5. Authenticated admin dashboard shell
  return <DashboardShell>{children}</DashboardShell>;
}
