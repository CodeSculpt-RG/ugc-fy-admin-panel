"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Globe, 
  Mail, 
  Database,
  Smartphone,
  Fingerprint,
  Save
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/lib/utils";


import { settingsService } from "@/app/services/systemServices";
import { useToast } from "@/app/hooks/useToast";

export default function SettingsPage() {
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      await settingsService.updateSetting("all", "bulk_update");
      showToast("System configuration committed", "success");
    } catch (error) {
      showToast("Protocol commitment failed", "error");
    }
  };

  const handleMaintenance = () => {
    showToast("Maintenance protocol initialized", "warning");
  };

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="System Configuration" 
          subtitle="Configure platform-wide parameters, security protocols, and integration architectures."
        >
          <button 
            onClick={handleSave}
            className="h-12 px-8 rounded-2xl bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
          >
            <Save className="w-4 h-4 mr-3" />
            Commit Changes
          </button>
        </PageHeader>


        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
           {/* Sidebar Navigation */}
           <div className="xl:col-span-1 space-y-2">
              {[
                { label: "General", icon: Globe, active: true },
                { label: "Security", icon: Shield, active: false },
                { label: "Notifications", icon: Bell, active: false },
                { label: "Email SMTP", icon: Mail, active: false },
                { label: "Database", icon: Database, active: false },
                { label: "Mobile App", icon: Smartphone, active: false },
              ].map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    "w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-sm",
                    item.active 
                      ? "bg-primary-blue text-white shadow-lg shadow-primary-blue/20" 
                      : "bg-[#111827] border border-white/10 text-[#F0F0FB]/40 hover:text-[#F0F0FB] hover:bg-white/[0.04]"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", item.active ? "text-white" : "text-[#F0F0FB]/20")} />
                  <span>{item.label}</span>
                </button>
              ))}
           </div>

           {/* Content */}
           <div className="xl:col-span-3 space-y-10">
              <section className="p-10 rounded-[40px] bg-[#0F172A] border border-white/[0.08] space-y-10 shadow-premium relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent" />
                 
                 <div>
                    <h3 className="text-xl font-black text-[#F0F0FB] tracking-tight leading-none">Platform Identity</h3>
                    <p className="text-[13px] text-[#F0F0FB]/40 mt-3 leading-relaxed font-medium">Core configuration parameters utilized across the administrative ecosystem.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F0F0FB]/30 ml-1">Enterprise Name</label>
                       <input defaultValue="UGC FY" className="w-full bg-white/[0.02] border border-white/[0.05] text-[#F0F0FB] font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary-blue/30 focus:bg-white/[0.05] transition-all shadow-inner" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F0F0FB]/30 ml-1">Support Vector Email</label>
                       <input defaultValue="support@ugc-fy.in" className="w-full bg-white/[0.02] border border-white/[0.05] text-[#F0F0FB] font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary-blue/30 focus:bg-white/[0.05] transition-all shadow-inner" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F0F0FB]/30 ml-1">Yield Fee Coefficient (%)</label>
                       <input defaultValue="15" type="number" className="w-full bg-white/[0.02] border border-white/[0.05] text-[#F0F0FB] font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary-blue/30 focus:bg-white/[0.05] transition-all shadow-inner" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F0F0FB]/30 ml-1">Fiscal Currency Base</label>
                       <input defaultValue="INR (₹)" className="w-full bg-white/[0.02] border border-white/[0.05] text-[#F0F0FB] font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary-blue/30 focus:bg-white/[0.05] transition-all shadow-inner" />
                    </div>
                 </div>
              </section>

              <section className="p-10 rounded-[40px] bg-[#0F172A] border border-white/[0.08] space-y-10 shadow-premium relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent" />
                 
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#F0F0FB] tracking-tight leading-none">Security Architecture</h3>
                      <p className="text-[13px] text-[#F0F0FB]/40 mt-3 leading-relaxed font-medium">Administrative access controls and authentication protocols.</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-primary-blue/10 border border-primary-blue/20 shadow-sm">
                      <Fingerprint className="w-6 h-6 text-primary-blue" />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors shadow-sm">
                       <div>
                          <p className="text-[14px] font-black text-[#F0F0FB] tracking-tight leading-none">Mandatory 2FA Protocol</p>
                          <p className="text-[12px] font-medium text-[#F0F0FB]/30 mt-2">Requires all administrative nodes to link a TOTP authenticator.</p>
                       </div>
                       <div className="w-14 h-7 rounded-full bg-primary-blue border border-primary-blue/20 relative cursor-pointer shadow-lg shadow-primary-blue/20">
                          <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white shadow-sm" />
                       </div>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.01] border border-white/[0.03] opacity-40 shadow-sm">
                       <div>
                          <p className="text-[14px] font-black text-[#F0F0FB] tracking-tight leading-none">Network Identifier Whitelist</p>
                          <p className="text-[12px] font-medium text-[#F0F0FB]/30 mt-2">Restrict platform access to specific geographic IP ranges.</p>
                       </div>
                       <div className="w-14 h-7 rounded-full bg-white/5 border border-white/10 relative cursor-not-allowed">
                          <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-white/10 shadow-sm" />
                       </div>
                    </div>
                 </div>
              </section>

              <section className="p-10 rounded-[40px] bg-error/[0.03] border border-error/15 space-y-8 shadow-sm relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/20 to-transparent" />
                 
                 <div>
                    <h3 className="text-xl font-black text-error tracking-tight leading-none">Termination Vectors</h3>
                    <p className="text-[13px] text-error/40 mt-3 leading-relaxed font-medium">Destructive operations that trigger immediate system state changes.</p>
                 </div>
                 <div className="flex items-center justify-between p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.05] shadow-inner">
                    <div>
                       <p className="text-sm font-black text-[#F0F0FB] tracking-tight leading-none">Maintenance Protocol</p>
                       <p className="text-[12px] font-medium text-[#F0F0FB]/30 mt-2">Immediately disable all user access for infrastructure maintenance.</p>
                    </div>
                    <button 
                      onClick={handleMaintenance}
                      className="h-11 px-8 border-2 border-error text-error font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-error hover:text-white transition-all shadow-lg shadow-error/10 active:scale-95"
                    >
                      Initialize
                    </button>
                 </div>
              </section>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}
