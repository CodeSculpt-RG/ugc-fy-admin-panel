"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import { SidebarProvider, useSidebar, useSidebarOptional } from "@/app/context/SidebarContext";
import { cn } from "@/app/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardShellProps) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary-blue/30 selection:text-primary-blue">
      <Sidebar />
      
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out ml-0 relative",
          isCollapsed ? "lg:ml-[88px]" : "lg:ml-[300px]"
        )}
      >
        <Navbar />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-background relative">
          {/* Subtle background glow to add depth */}
          <div className="absolute top-0 left-1/4 w-1/2 h-2/3 bg-primary-blue/10 blur-[180px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 right-1/4 w-1/3 h-1/2 bg-accent-orange/5 blur-[150px] pointer-events-none -z-10" />
          
          <div className="p-8 md:p-12 lg:p-20">

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-[1920px] mx-auto w-full section-spacing"
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
