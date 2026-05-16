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
import { cn } from "@/app/lib/utils";

import { useToast } from "@/app/hooks/useToast";

export default function SecurityPage() {
  const { showToast } = useToast();

  const handleEnforce = () => {
    showToast("Credential rotation protocol enforced system-wide", "success");
  };

  const handleQueryLogs = () => {
    showToast("Forensic log query initiated", "info");
  };

  const handleConfigureProtocol = () => {
    showToast("Intelligence protocol re-configured", "success");
  };

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Security Infrastructure" 
          subtitle="Real-time monitoring of platform integrity, threat vector detection, and access policy enforcement."
        />


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-10">
              {/* Threat Level */}
              <div className="p-12 rounded-[48px] bg-[#0F172A] border border-white/10 text-[#F0F0FB] relative overflow-hidden shadow-premium">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-success-green/20 to-transparent" />
                 
                 <div className="relative z-10 flex items-center justify-between gap-12">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F0F0FB]/30 mb-4">System Intelligence State</p>
                      <h3 className="text-5xl font-black text-success-green flex items-center tracking-tighter">
                         NOMINAL
                         <div className="ml-4 w-3 h-3 rounded-full bg-success-green animate-pulse" />
                      </h3>
                      <p className="text-[15px] font-medium text-[#F0F0FB]/40 mt-6 max-w-md leading-relaxed">
                         Platform integrity verified. All security subsystems are operating within established enterprise parameters. 
                         Next comprehensive forensic scan scheduled in <span className="text-[#F0F0FB]">42 minutes</span>.
                      </p>
                    </div>
                    <div className="w-40 h-40 rounded-full border-[12px] border-white/[0.03] flex items-center justify-center relative shrink-0 shadow-inner">
                       <div className="absolute inset-0 rounded-full border-2 border-success-green/30 border-t-transparent animate-spin duration-[4s]" />
                       <ShieldCheck className="w-16 h-16 text-success-green" />
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-80 h-80 bg-success-green/10 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-blue/5 blur-[100px] -ml-32 -mb-32 pointer-events-none" />
              </div>

              {/* Security Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="p-8 rounded-[40px] bg-[#111827] border border-white/[0.08] space-y-6 shadow-premium hover:border-primary-blue/20 transition-all group relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center border border-primary-blue/15 shadow-sm">
                       <Globe className="w-7 h-7 text-primary-blue" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-[#F0F0FB] tracking-tight leading-none">WAF & DDoS Mitigation</h4>
                      <p className="text-[13px] text-[#F0F0FB]/40 mt-3 leading-relaxed font-medium">Enterprise edge proxy is active. 14,202 request vectors filtered in the last 24h cycle.</p>
                    </div>
                    <button 
                      onClick={handleQueryLogs}
                      className="text-[10px] font-black uppercase tracking-widest text-primary-blue hover:text-[#F0F0FB] transition-colors flex items-center group/btn"
                    >
                       Query Traffic Logs 
                       <Activity className="ml-2 w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-all" />
                    </button>
                 </div>
                 <div className="p-8 rounded-[40px] bg-[#111827] border border-white/[0.08] space-y-6 shadow-premium hover:border-accent-orange/20 transition-all group relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-orange/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-14 h-14 rounded-2xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/15 shadow-sm">
                       <Fingerprint className="w-7 h-7 text-accent-orange" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-[#F0F0FB] tracking-tight leading-none">Auth Anomaly Intelligence</h4>
                      <p className="text-[13px] text-[#F0F0FB]/40 mt-3 leading-relaxed font-medium">Monitoring for high-velocity brute force and credential mutation. 0 suspicious events detected.</p>
                    </div>
                    <button 
                      onClick={handleConfigureProtocol}
                      className="text-[10px] font-black uppercase tracking-widest text-accent-orange hover:text-[#F0F0FB] transition-colors flex items-center group/btn"
                    >
                       Configure Protocol 
                       <Lock className="ml-2 w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-all" />
                    </button>
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <div className="p-8 rounded-[40px] bg-[#0F172A] border border-white/[0.08] shadow-premium">
                 <h4 className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.4em] mb-8">System Health Stream</h4>
                 <div className="space-y-8">
                    {[
                      { label: "SSL Certification", status: "Verified", icon: Lock, color: "text-success-green" },
                      { label: "Storage Encryption", status: "AES-512", icon: Server, color: "text-success-green" },
                      { label: "Rate Limiting Vector", status: "Enforced", icon: Activity, color: "text-primary-blue" },
                      { label: "Identity Policy", status: "Active", icon: ShieldAlert, color: "text-warning" },
                    ].map((event) => (
                      <div key={event.label} className="flex items-center justify-between group cursor-pointer">
                         <div className="flex items-center space-x-4">
                            <event.icon className={cn("w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity", event.color)} />
                            <span className="text-[13px] font-black text-[#F0F0FB]/60 tracking-tight">{event.label}</span>
                         </div>
                         <span className={cn("text-[9px] font-black uppercase tracking-widest", event.color)}>{event.status}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="p-10 rounded-[40px] bg-error/[0.03] border border-error/15 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/20 to-transparent" />
                 <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                       <AlertTriangle className="w-5 h-5 text-error" />
                       <h4 className="text-sm font-black text-error uppercase tracking-widest">Security Advisory</h4>
                    </div>
                    <p className="text-[13px] text-[#F0F0FB]/40 mb-8 leading-relaxed font-medium">
                       2 administrative nodes have not rotated credentials within the 90-day threshold. This increases entropy risk.
                    </p>
                    <button 
                      onClick={handleEnforce}
                      className="w-full h-12 bg-error text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-error/90 transition-all shadow-lg shadow-error/20 active:scale-95"
                    >
                       Enforce Lifecycle Rotation
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}
