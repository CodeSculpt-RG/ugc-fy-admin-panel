"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import DashboardShell from "@/app/components/layout/DashboardShell";

import AdminLoginPage from "./login/page";
import { Loader2 } from "lucide-react";

const TEXT = {
  securingConnection: "Securing Connection",
} as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/\/$/, "");
  const router = useRouter();
  const { admin, loading } = useAdminAuth();

  useEffect(() => {
    if (!admin) return;
    
    const needsSetup = admin.mustChangePassword || admin.inviteStatus === "pending";
    if (needsSetup && normalizedPath !== "/admin/force-password-change") {
      router.replace("/admin/force-password-change");
    }
  }, [admin, normalizedPath, router]);

  // Render a premium loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.08),transparent_50%)] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center mb-6 shadow-glow animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 animate-pulse">
            {TEXT.securingConnection}
          </p>
        </div>
      </div>
    );
  }

  const publicRoutes = [
    "/admin/login",
    "/admin/auth/callback",
    "/admin/forgot-password",
    "/admin/reset-password",
    "/admin/setup-password"
  ];

  if (publicRoutes.includes(normalizedPath)) {
    return <>{children}</>;
  }

  // Strict Layout Guard: If not authenticated, render login page component
  if (!admin) {
    return <AdminLoginPage />;
  }

  // Bypass shell layout for password change page
  if (normalizedPath === "/admin/force-password-change") {
    return <>{children}</>;
  }

  return (
    <DashboardShell>{children}</DashboardShell>
  );
}
