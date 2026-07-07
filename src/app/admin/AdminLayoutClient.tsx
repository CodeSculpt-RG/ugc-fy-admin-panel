"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import DashboardShell from "@/app/components/layout/DashboardShell";
import AdminLoginPage from "./login/page";
import { Loader2, ShieldAlert, AlertCircle } from "lucide-react";

const TEXT = {
  securingConnection: "Securing Connection",
} as const;

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/\/$/, "");
  const router = useRouter();
  const { admin, status, refreshAdmin } = useAdminAuth();
  
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

  // 1. Initial stable render during SSR or active initialization
  if (!mounted || status === "initializing") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <section className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.08),transparent_50%)] animate-pulse" />
        <article className="relative z-10 flex flex-col items-center">
          <span className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center mb-6 shadow-glow animate-pulse block">
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

  // 3. Unauthenticated redirects to login immediately but renders a safe fallback meantime
  if (status === "unauthenticated") {
    // If somehow we got here on a protected route while unauthenticated, trigger an immediate client-side redirect.
    // proxy.ts should have handled this, but just in case:
    router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Redirecting to Secure Login</p>
      </main>
    );
  }

  // 4. Unauthorized users should not access the layout
  if (status === "unauthorized") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-12 text-center">
        <div className="w-20 h-20 rounded-[30px] bg-accent-orange/10 flex items-center justify-center mb-8 border border-accent-orange/20 shadow-lg shadow-accent-orange/5">
          <ShieldAlert className="w-10 h-10 text-accent-orange" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-4 tracking-tight uppercase">Access Denied</h2>
        <p className="text-foreground/40 max-w-md leading-relaxed font-medium uppercase text-[11px] tracking-widest">
          You do not have permission to access this admin section.
        </p>
      </div>
    );
  }

  // 5. Network errors or verification failures
  if (status === "error") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center mb-6 shadow-glow">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-black text-foreground tracking-tight mb-2">
          Unable to verify admin session
        </h1>
        <p className="text-sm text-text-secondary max-w-md leading-relaxed mb-8">
          Please refresh or sign in again. The network request might have been interrupted.
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

  // 6. Strict Layout Guard Backup (If somehow admin is null but status isn't mapping correctly)
  if (!admin) {
    return <AdminLoginPage />;
  }

  // 7. Force password setup bypasses the shell
  if (normalizedPath === "/admin/force-password-change") {
    return <>{children}</>;
  }

  // 8. Authenticated admin dashboard shell
  return <DashboardShell>{children}</DashboardShell>;
}
