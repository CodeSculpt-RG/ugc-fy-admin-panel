"use client";

import React, { ReactNode } from "react";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/auth/rbac";
import type { AdminPermission, VerifiedAdmin } from "@/lib/api/adminPermissions";
import { AlertCircle } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: AdminPermission;
  anyPermission?: AdminPermission[];
  allPermissions?: AdminPermission[];
  fallback?: ReactNode;
  showUnauthorizedState?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback,
  showUnauthorizedState = false,
}: PermissionGuardProps) {
  const { admin, loading } = useAdminAuth();

  // If auth is still loading, wait
  if (loading) return null;

  let isAllowed = true;

  if (permission && !hasPermission(admin as unknown as VerifiedAdmin, permission)) {
    isAllowed = false;
  } else if (anyPermission && anyPermission.length > 0 && !hasAnyPermission(admin as unknown as VerifiedAdmin, anyPermission)) {
    isAllowed = false;
  } else if (allPermissions && allPermissions.length > 0 && !hasAllPermissions(admin as unknown as VerifiedAdmin, allPermissions)) {
    isAllowed = false;
  }

  if (!isAllowed) {
    if (fallback) return <>{fallback}</>;
    
    if (showUnauthorizedState) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-6 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-foreground/50 max-w-md mx-auto mb-8">
            You do not have the required administrative privileges to view or perform actions in this module.
          </p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
