"use client";

import React, { useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.mustChangePassword && pathname !== "/admin/force-password-change") {
      router.replace("/admin/force-password-change");
    }
  }, [user, pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
