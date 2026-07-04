"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useToast } from "@/app/hooks/useToast";
import { Loader2, ShieldCheck, KeyRound, User, Activity, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import AvatarUpload from "@/app/components/admin/profile/AvatarUpload";
import ActivityTab from "@/app/components/admin/profile/ActivityTab";
import { cn } from "@/app/lib/utils";

type Tab = "profile" | "security" | "permissions" | "activity";

export default function AdminProfilePage() {
  const { admin, session, refreshAdmin } = useAdminAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Use initial state from admin if available. 
  const [fullName, setFullName] = useState(admin?.full_name || admin?.name || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    try {
      setIsSavingProfile(true);
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ full_name: fullName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update profile");

      showToast("Profile updated successfully", "success");
      await refreshAdmin();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An error occurred";
      showToast(msg, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpdate = async (url: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ avatar_url: url }),
      });
      if (res.ok) {
        await refreshAdmin();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    
    if (password.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await fetch("/api/admin/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update password");

      showToast("Password updated successfully", "success");
      setPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An error occurred";
      showToast(msg, "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!admin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: KeyRound },
    { id: "permissions", label: "Permissions", icon: ShieldCheck },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 pt-6 px-4 sm:px-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase">
            Admin Profile
          </h1>
          <p className="text-text-secondary mt-2">Manage your personal account settings and security.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-elevated px-4 py-2 rounded-2xl border border-border">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
            {admin.isActive ? "Active Session" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center overflow-x-auto scrollbar-hide space-x-2 bg-surface p-2 rounded-[20px] border border-border w-max max-w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-glow" 
                  : "text-text-secondary hover:text-foreground hover:bg-surface-elevated"
              )}
            >
              <tab.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "opacity-70")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-surface rounded-3xl border border-border p-6 md:p-10 shadow-sm relative overflow-hidden min-h-[400px]">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {activeTab === "profile" && (
          <div className="relative z-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <AvatarUpload 
                  currentAvatarUrl={admin.avatarUrl} 
                  adminName={admin.full_name || admin.name} 
                  onUploadSuccess={handleAvatarUpdate} 
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground">Profile Photo</h3>
                <p className="text-sm text-text-secondary">
                  Upload a photo to help others identify you. Max 5MB.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-wider">
                  Role: {admin.role.replace("_", " ")}
                </div>
              </div>
            </div>

            <div className="h-px bg-border w-full" />

            <form onSubmit={handleProfileSave} className="max-w-2xl space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Email Address</label>
                  <input
                    type="email"
                    value={admin.email}
                    disabled
                    className="w-full bg-surface-elevated border border-transparent rounded-2xl px-4 py-3 text-sm font-semibold text-text-secondary cursor-not-allowed opacity-70"
                  />
                  <p className="text-[11px] text-text-secondary">Email addresses cannot be changed directly for security reasons.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile || fullName === (admin.full_name || admin.name)}
                className="flex items-center justify-center h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "security" && (
          <div className="relative z-10 max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Change Password
              </h3>
              <p className="text-sm text-text-secondary mt-1">Ensure your account is using a long, random password to stay secure.</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6 bg-background rounded-3xl border border-border p-6 md:p-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-text-secondary">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl px-4 py-3 pr-12 text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Repeat new password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword || !password || password !== confirmPassword}
                  className="flex items-center justify-center h-12 px-8 rounded-2xl bg-foreground text-background font-black text-sm transition-all hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                >
                  {isSavingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-foreground">Granted Permissions</h3>
                <p className="text-sm text-text-secondary mt-1 max-w-xl">
                  As a <strong>{admin.role.replace("_", " ").toUpperCase()}</strong>, you have access to the following capabilities across the platform. Permissions are managed by system owners.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admin.permissions.map((perm) => (
                <div key={perm} className="flex items-center gap-3 p-4 rounded-2xl bg-background border border-border">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{perm.split('.')[0]}</p>
                    <p className="text-[10px] uppercase font-black tracking-wider text-text-secondary">{perm.split('.')[1] || 'access'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <ActivityTab />
        )}

      </div>
    </div>
  );
}


