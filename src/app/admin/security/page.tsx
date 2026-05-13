"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Server,
  Zap,
  Activity,
  AlertTriangle,
  Fingerprint
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function SecurityPage() {
  return (
    <DashboardShell>
      <PageHeader 
        title="Security Operations" 
        subtitle="Monitor platform integrity, manage threat detection, and enforce access policies."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
         <div className="lg:col-span-2 space-y-8">
            {/* Threat Level */}
            <div className="p-8 rounded-[40px] bg-gradient-to-br from-dark-surface to-black border border-white/5 relative overflow-hidden">
               <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-soft-white/30 mb-2">System Threat Level</p>
                    <h3 className="text-4xl font-black text-success flex items-center">
                       NOMINAL
                       <Zap className="ml-3 w-8 h-8 fill-success" />
                    </h3>
                    <p className="text-sm text-soft-white/40 mt-4 max-w-md">
                       No active threats detected. All security systems are operating within normal parameters. 
                       Last full system scan completed 14 minutes ago.
                    </p>
                  </div>
                  <div className="w-32 h-32 rounded-full border-8 border-success/10 flex items-center justify-center relative">
                     <div className="absolute inset-0 rounded-full border-2 border-success border-t-transparent animate-spin duration-[3s]" />
                     <ShieldCheck className="w-12 h-12 text-success" />
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 blur-[100px] -mr-32 -mt-32" />
            </div>

            {/* Security Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 rounded-[32px] bg-dark-surface border border-white/5 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20">
                     <Globe className="w-5 h-5 text-primary-blue" />
                  </div>
                  <h4 className="text-sm font-bold text-soft-white">WAF & DDoS Protection</h4>
                  <p className="text-xs text-soft-white/40">Cloudflare proxy is active. 14,202 requests filtered in the last 24h.</p>
                  <Button variant="ghost" size="sm" className="text-primary-blue font-bold p-0 h-auto hover:bg-transparent">
                     View Traffic Logs →
                  </Button>
               </div>
               <div className="p-6 rounded-[32px] bg-dark-surface border border-white/5 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20">
                     <Fingerprint className="w-5 h-5 text-accent-orange" />
                  </div>
                  <h4 className="text-sm font-bold text-soft-white">Auth Anomaly Detection</h4>
                  <p className="text-xs text-soft-white/40">Monitoring for brute force and credential stuffing. 0 suspicious logins.</p>
                  <Button variant="ghost" size="sm" className="text-accent-orange font-bold p-0 h-auto hover:bg-transparent">
                     Configure Rules →
                  </Button>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="p-6 rounded-[32px] bg-dark-surface border border-white/5">
               <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em] mb-6">Real-time Events</h4>
               <div className="space-y-6">
                  {[
                    { label: "SSL Certificate", status: "Valid", icon: Lock, color: "success" },
                    { label: "Database Encryption", status: "AES-256", icon: Server, color: "success" },
                    { label: "API Rate Limiting", status: "Active", icon: Activity, color: "primary-blue" },
                    { label: "Admin IP Policy", status: "Enforced", icon: ShieldAlert, color: "warning" },
                  ].map((event) => (
                    <div key={event.label} className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                          <event.icon className={`w-4 h-4 text-${event.color}`} />
                          <span className="text-xs font-bold text-soft-white/80">{event.label}</span>
                       </div>
                       <span className={`text-[10px] font-black uppercase text-${event.color}`}>{event.status}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-8 rounded-[32px] bg-error/10 border border-error/20">
               <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-error" />
                  <h4 className="text-sm font-bold text-error">Security Advisory</h4>
               </div>
               <p className="text-xs text-soft-white/60 mb-6">
                  2 admin accounts haven&apos;t rotated their passwords in over 90 days. This increases risk of unauthorized access.
               </p>
               <Button className="w-full bg-error hover:bg-error/90 text-white font-bold rounded-xl">
                  Enforce Rotation
               </Button>
            </div>
         </div>
      </div>
    </DashboardShell>
  );
}
