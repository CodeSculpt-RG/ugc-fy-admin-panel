"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import { SidebarProvider, useSidebarOptional } from "@/app/context/SidebarContext";
import { useAdminAuth } from "@/app/context/AdminAuthContext";

interface DashboardShellProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardShellProps) {
  const { admin } = useAdminAuth();

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      {admin && <Sidebar />}
      
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-500 ease-in-out ml-0 relative">
        {admin && <Navbar />}
        
        <main className="flex-1 min-w-0 overflow-x-hidden bg-background relative">
          
          <div className="p-8 md:p-12 lg:p-20">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-[1180px] mx-auto w-full section-spacing"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
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
