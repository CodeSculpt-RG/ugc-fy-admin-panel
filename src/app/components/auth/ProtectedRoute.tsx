"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { type AdminPermission } from "@/lib/api/adminPermissions";
import { LoadingState } from "@/app/components/ui/shared-states";
import { ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: AdminPermission;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { admin, loading, hasPermission } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/admin/login");
    }
  }, [loading, admin, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingState message="Verifying Administrative Credentials..." />
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect in useEffect
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-12 text-center">
        <div className="w-20 h-20 rounded-[30px] bg-accent-orange/10 flex items-center justify-center mb-8 border border-accent-orange/20 shadow-lg shadow-accent-orange/5">
          <ShieldAlert className="w-10 h-10 text-accent-orange" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-4 tracking-tight uppercase">Access Restricted</h2>
        <p className="text-foreground/40 max-w-md leading-relaxed font-medium uppercase text-[11px] tracking-widest">
          Your current administrative role ({admin.role.replace("_", " ")}) lacks the required vector permission: 
          <span className="text-accent-orange ml-2 font-black">&apos;{permission}&apos;</span>
        </p>
        <button 
          onClick={() => router.push("/admin/dashboard")}
          className="mt-10 h-12 px-8 rounded-2xl bg-surface-elevated border border-border text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-all active:scale-95"
        >
          Return to Command Center
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
