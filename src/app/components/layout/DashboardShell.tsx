"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { SidebarProvider, useSidebarOptional } from "@/app/context/SidebarContext";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { motion } from "framer-motion";

interface DashboardShellProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardShellProps) {
  const { admin } = useAdminAuth();

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.10),transparent_30rem),linear-gradient(180deg,#F7F7F8_0%,#EEF0F3_100%)] text-neutral-950 selection:bg-orange-500/20 selection:text-orange-700">
      {admin && <Sidebar />}
      
      <section className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-6 overflow-x-hidden relative">
        <div className="mx-auto w-full max-w-[1500px]">
          {admin && <Navbar />}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const existingContext = useSidebarOptional();
  if (existingContext !== undefined) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
