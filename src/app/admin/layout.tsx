"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
