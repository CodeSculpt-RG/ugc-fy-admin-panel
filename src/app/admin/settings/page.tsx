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

export default function SettingsPage() {
  return (
    <DashboardShell>
      <PageHeader 
        title="System Settings" 
        subtitle="Configure platform-wide parameters, security policies, and integrations."
      >
        <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 px-8 font-bold">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Sidebar Navigation */}
         <div className="xl:col-span-1 space-y-1">
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
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                  item.active 
                    ? "bg-primary-blue/10 text-primary-blue border border-primary-blue/20" 
                    : "text-soft-white/40 hover:text-soft-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
         </div>

         {/* Content */}
         <div className="xl:col-span-3 space-y-8">
            <section className="p-8 rounded-[32px] bg-dark-surface border border-white/5 space-y-8">
               <div>
                  <h3 className="text-lg font-bold text-soft-white">Platform Identity</h3>
                  <p className="text-sm text-soft-white/40">These details are visible across the admin console and in platform communications.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-soft-white/30 ml-1">Platform Name</label>
                     <Input defaultValue="UGC FY" className="bg-white/5 border-white/10 text-soft-white h-12 rounded-xl focus:border-primary-blue/50" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-soft-white/30 ml-1">Support Email</label>
                     <Input defaultValue="support@ugc-fy.in" className="bg-white/5 border-white/10 text-soft-white h-12 rounded-xl focus:border-primary-blue/50" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-soft-white/30 ml-1">Platform Fee (%)</label>
                     <Input defaultValue="15" type="number" className="bg-white/5 border-white/10 text-soft-white h-12 rounded-xl focus:border-primary-blue/50" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-soft-white/30 ml-1">Default Currency</label>
                     <Input defaultValue="INR (₹)" className="bg-white/5 border-white/10 text-soft-white h-12 rounded-xl focus:border-primary-blue/50" />
                  </div>
               </div>
            </section>

            <section className="p-8 rounded-[32px] bg-dark-surface border border-white/5 space-y-8">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-soft-white">Security & Access</h3>
                    <p className="text-sm text-soft-white/40">Configure administrative access controls and authentication policies.</p>
                  </div>
                  <Fingerprint className="w-8 h-8 text-primary-blue/20" />
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                     <div>
                        <p className="text-sm font-bold text-soft-white">Enforce 2FA for Admins</p>
                        <p className="text-xs text-soft-white/30">Requires all admin users to link a TOTP authenticator.</p>
                     </div>
                     <div className="w-12 h-6 rounded-full bg-primary-blue/20 border border-primary-blue/30 relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-primary-blue" />
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 opacity-50">
                     <div>
                        <p className="text-sm font-bold text-soft-white">IP Whitelisting</p>
                        <p className="text-xs text-soft-white/30">Restrict admin panel access to specific IP ranges.</p>
                     </div>
                     <div className="w-12 h-6 rounded-full bg-white/5 border border-white/10 relative">
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white/20" />
                     </div>
                  </div>
               </div>
            </section>

            <section className="p-8 rounded-[32px] bg-error/5 border border-error/10 space-y-6">
               <div>
                  <h3 className="text-lg font-bold text-error">Danger Zone</h3>
                  <p className="text-sm text-error/60">Destructive actions that cannot be undone.</p>
               </div>
               <div className="flex items-center justify-between p-4 rounded-2xl bg-error/5 border border-error/10">
                  <div>
                     <p className="text-sm font-bold text-soft-white">Maintenance Mode</p>
                     <p className="text-xs text-soft-white/30">Disable the platform for all users immediately.</p>
                  </div>
                  <Button variant="outline" className="border-error/20 text-error hover:bg-error hover:text-white rounded-xl font-bold">
                    Activate
                  </Button>
               </div>
            </section>
         </div>
      </div>
    </DashboardShell>
  );
}

import { cn } from "@/app/lib/utils";
