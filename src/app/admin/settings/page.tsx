"use client";

import React, { useState, useCallback, useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { DataSurface } from "@/app/components/shared/DataSurface";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { GlassPanel } from "@/app/components/shared/GlassPanel";
import { PageHeader } from "@/app/components/ui/core";
import { LoadingState, ErrorState, MissingTableState } from "@/app/components/ui/shared-states";
import {
  Globe,
  Shield,
  Bell,
  Mail,
  Database,
  Smartphone,
  RefreshCw,
  Save,
  Lock,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { isAbortError } from "@/app/services/adminApiClient";
import { settingsService, PlatformSettingRow, SettingsMissingTableError } from "@/app/services/settingsService";
import { useToast } from "@/app/hooks/useToast";
import { useAdminAuth } from "@/app/context/AdminAuthContext";

type SettingsForm = {
  general_settings: {
    enterprise_name: string;
    support_email: string;
    yield_fee_coefficient: string;
    currency: string;
  };
  security_settings: {
    require_admin_2fa: boolean;
    max_login_attempts: string;
    session_timeout_minutes: string;
    allow_owner_override: boolean;
  };
  notification_settings: {
    email_notifications: boolean;
    approval_alerts: boolean;
    payment_alerts: boolean;
    security_alerts: boolean;
  };
  email_smtp_settings: {
    smtp_host: string;
    smtp_port: string;
    smtp_username: string;
    smtp_from_email: string;
    smtp_secure: boolean;
  };
  database_settings: {
    realtime_enabled: boolean;
    daily_backup_enabled: boolean;
    query_timeout_seconds: string;
    schema_cache_reload: boolean;
  };
  mobile_app_settings: {
    android_enabled: boolean;
    ios_enabled: boolean;
    force_update: boolean;
    minimum_app_version: string;
    maintenance_message: string;
  };
};

const defaultSettingsForm: SettingsForm = {
  general_settings: {
    enterprise_name: "UGC FY Enterprise",
    support_email: "support@ugc-fy.in",
    yield_fee_coefficient: "15",
    currency: "INR",
  },
  security_settings: {
    require_admin_2fa: false,
    max_login_attempts: "5",
    session_timeout_minutes: "1440",
    allow_owner_override: true,
  },
  notification_settings: {
    email_notifications: true,
    approval_alerts: true,
    payment_alerts: true,
    security_alerts: true,
  },
  email_smtp_settings: {
    smtp_host: "",
    smtp_port: "587",
    smtp_username: "",
    smtp_from_email: "",
    smtp_secure: false,
  },
  database_settings: {
    realtime_enabled: true,
    daily_backup_enabled: true,
    query_timeout_seconds: "30",
    schema_cache_reload: true,
  },
  mobile_app_settings: {
    android_enabled: true,
    ios_enabled: true,
    force_update: false,
    minimum_app_version: "1.0.0",
    maintenance_message: "",
  },
};

function normalizeSettingsForm(rows: PlatformSettingRow[]): SettingsForm {
  const map = new Map<string, Record<string, unknown>>();
  rows.forEach((r) => map.set(r.key, r.value));

  const gen = map.get("general_settings") ?? {};
  const sec = map.get("security_settings") ?? {};
  const not = map.get("notification_settings") ?? {};
  const eml = map.get("email_smtp_settings") ?? {};
  const db = map.get("database_settings") ?? {};
  const mob = map.get("mobile_app_settings") ?? {};

  return {
    general_settings: {
      enterprise_name: String(gen.enterprise_name ?? defaultSettingsForm.general_settings.enterprise_name),
      support_email: String(gen.support_email ?? defaultSettingsForm.general_settings.support_email),
      yield_fee_coefficient: String(gen.yield_fee_coefficient ?? defaultSettingsForm.general_settings.yield_fee_coefficient),
      currency: String(gen.currency ?? defaultSettingsForm.general_settings.currency),
    },
    security_settings: {
      require_admin_2fa: Boolean(sec.require_admin_2fa ?? defaultSettingsForm.security_settings.require_admin_2fa),
      max_login_attempts: String(sec.max_login_attempts ?? defaultSettingsForm.security_settings.max_login_attempts),
      session_timeout_minutes: String(sec.session_timeout_minutes ?? defaultSettingsForm.security_settings.session_timeout_minutes),
      allow_owner_override: Boolean(sec.allow_owner_override ?? defaultSettingsForm.security_settings.allow_owner_override),
    },
    notification_settings: {
      email_notifications: Boolean(not.email_notifications ?? defaultSettingsForm.notification_settings.email_notifications),
      approval_alerts: Boolean(not.approval_alerts ?? defaultSettingsForm.notification_settings.approval_alerts),
      payment_alerts: Boolean(not.payment_alerts ?? defaultSettingsForm.notification_settings.payment_alerts),
      security_alerts: Boolean(not.security_alerts ?? defaultSettingsForm.notification_settings.security_alerts),
    },
    email_smtp_settings: {
      smtp_host: String(eml.smtp_host ?? defaultSettingsForm.email_smtp_settings.smtp_host),
      smtp_port: String(eml.smtp_port ?? defaultSettingsForm.email_smtp_settings.smtp_port),
      smtp_username: String(eml.smtp_username ?? defaultSettingsForm.email_smtp_settings.smtp_username),
      smtp_from_email: String(eml.smtp_from_email ?? defaultSettingsForm.email_smtp_settings.smtp_from_email),
      smtp_secure: Boolean(eml.smtp_secure ?? defaultSettingsForm.email_smtp_settings.smtp_secure),
    },
    database_settings: {
      realtime_enabled: Boolean(db.realtime_enabled ?? defaultSettingsForm.database_settings.realtime_enabled),
      daily_backup_enabled: Boolean(db.daily_backup_enabled ?? defaultSettingsForm.database_settings.daily_backup_enabled),
      query_timeout_seconds: String(db.query_timeout_seconds ?? defaultSettingsForm.database_settings.query_timeout_seconds),
      schema_cache_reload: Boolean(db.schema_cache_reload ?? defaultSettingsForm.database_settings.schema_cache_reload),
    },
    mobile_app_settings: {
      android_enabled: Boolean(mob.android_enabled ?? defaultSettingsForm.mobile_app_settings.android_enabled),
      ios_enabled: Boolean(mob.ios_enabled ?? defaultSettingsForm.mobile_app_settings.ios_enabled),
      force_update: Boolean(mob.force_update ?? defaultSettingsForm.mobile_app_settings.force_update),
      minimum_app_version: String(mob.minimum_app_version ?? defaultSettingsForm.mobile_app_settings.minimum_app_version),
      maintenance_message: String(mob.maintenance_message ?? defaultSettingsForm.mobile_app_settings.maintenance_message),
    },
  };
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const { hasPermission, loading: authLoading } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<keyof SettingsForm>("general_settings");
  const [form, setForm] = useState<SettingsForm>(defaultSettingsForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [missingTableInfo, setMissingTableInfo] = useState<{ isMissing: boolean; name: string; sql: string }>({
    isMissing: false,
    name: "",
    sql: "",
  });

  const canRead = hasPermission("settings.read");
  const canWrite = hasPermission("settings.write");

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window === "undefined") return;
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "security") {
        setActiveSection("security_settings");
      }
    });
  }, []);

  const loadSettings = useCallback(async (signal?: AbortSignal) => {
    if (authLoading) return;
    if (!canRead) {
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setIsUnauthorized(false);
    setMissingTableInfo({ isMissing: false, name: "", sql: "" });
    try {
      const rows = await settingsService.getSettings(signal);
      const normalized = normalizeSettingsForm(rows);
      setForm(normalized);
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      if (error instanceof SettingsMissingTableError) {
        setMissingTableInfo({ isMissing: true, name: error.tableName, sql: error.migrationSql });
        return;
      }
      const msg = error instanceof Error ? error.message : "Failed to load settings";
      console.error("[SettingsPage] Sync failed:", msg);
      if (msg.includes("permission") || msg.includes("unauthorized") || msg.includes("DENIED")) {
        setIsUnauthorized(true);
      } else {
        setIsError(true);
        showToast("Infrastructure synchronization failed.", "error");
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [authLoading, canRead, showToast]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadSettings(controller.signal);
      }
    });
    return () => controller.abort(new DOMException("Settings request cancelled", "AbortError"));
  }, [loadSettings]);

  const handleSave = async () => {
    if (!canWrite) {
      showToast("Permission Denied: Required permission settings.write", "error");
      return;
    }

    setIsSaving(true);
    try {
      let payload: Record<string, unknown> = {};

      if (activeSection === "general_settings") {
        const yieldVal = Number(form.general_settings.yield_fee_coefficient);
        if (isNaN(yieldVal) || yieldVal < 0 || yieldVal > 100) {
          showToast("Invalid Yield Fee Coefficient percentage", "error");
          setIsSaving(false);
          return;
        }
        payload = {
          enterprise_name: form.general_settings.enterprise_name,
          support_email: form.general_settings.support_email,
          yield_fee_coefficient: yieldVal,
          currency: form.general_settings.currency,
        };
      } else if (activeSection === "security_settings") {
        const maxAttempts = Number(form.security_settings.max_login_attempts);
        const timeoutMins = Number(form.security_settings.session_timeout_minutes);
        if (isNaN(maxAttempts) || maxAttempts < 1) {
          showToast("Invalid Max Login Attempts", "error");
          setIsSaving(false);
          return;
        }
        if (isNaN(timeoutMins) || timeoutMins < 1) {
          showToast("Invalid Session Timeout", "error");
          setIsSaving(false);
          return;
        }
        payload = {
          require_admin_2fa: Boolean(form.security_settings.require_admin_2fa),
          max_login_attempts: maxAttempts,
          session_timeout_minutes: timeoutMins,
          allow_owner_override: Boolean(form.security_settings.allow_owner_override),
        };
      } else if (activeSection === "notification_settings") {
        payload = {
          email_notifications: Boolean(form.notification_settings.email_notifications),
          approval_alerts: Boolean(form.notification_settings.approval_alerts),
          payment_alerts: Boolean(form.notification_settings.payment_alerts),
          security_alerts: Boolean(form.notification_settings.security_alerts),
        };
      } else if (activeSection === "email_smtp_settings") {
        const portNum = Number(form.email_smtp_settings.smtp_port);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          showToast("Invalid SMTP Port number", "error");
          setIsSaving(false);
          return;
        }
        payload = {
          smtp_host: form.email_smtp_settings.smtp_host,
          smtp_port: portNum,
          smtp_username: form.email_smtp_settings.smtp_username,
          smtp_from_email: form.email_smtp_settings.smtp_from_email,
          smtp_secure: Boolean(form.email_smtp_settings.smtp_secure),
        };
      } else if (activeSection === "database_settings") {
        const timeoutSecs = Number(form.database_settings.query_timeout_seconds);
        if (isNaN(timeoutSecs) || timeoutSecs < 1) {
          showToast("Invalid Query Timeout", "error");
          setIsSaving(false);
          return;
        }
        payload = {
          realtime_enabled: Boolean(form.database_settings.realtime_enabled),
          daily_backup_enabled: Boolean(form.database_settings.daily_backup_enabled),
          query_timeout_seconds: timeoutSecs,
          schema_cache_reload: Boolean(form.database_settings.schema_cache_reload),
        };
      } else if (activeSection === "mobile_app_settings") {
        payload = {
          android_enabled: Boolean(form.mobile_app_settings.android_enabled),
          ios_enabled: Boolean(form.mobile_app_settings.ios_enabled),
          force_update: Boolean(form.mobile_app_settings.force_update),
          minimum_app_version: form.mobile_app_settings.minimum_app_version,
          maintenance_message: form.mobile_app_settings.maintenance_message,
        };
      }

      await settingsService.updateSetting(activeSection, payload);
      showToast(`Section ${activeSection.replace("_settings", "").toUpperCase()} committed successfully`, "success");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Commitment failed";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const sections: { key: keyof SettingsForm; label: string; icon: React.ElementType }[] = [
    { key: "general_settings", label: "General", icon: Globe },
    { key: "security_settings", label: "Security", icon: Shield },
    { key: "notification_settings", label: "Notifications", icon: Bell },
    { key: "email_smtp_settings", label: "Email SMTP", icon: Mail },
    { key: "database_settings", label: "Database", icon: Database },
    { key: "mobile_app_settings", label: "Mobile App", icon: Smartphone },
  ];

  if (isUnauthorized) {
    return (
      <DashboardShell>
        <div className="space-y-5">
          <CommandHeader
            title="System Configuration"
            description="Configure platform-wide parameters, security protocols, and integration architectures."
          />
          <div className="p-16 rounded-[40px] bg-card-bg border border-border text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8 text-error" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Access Restricted</h2>
              <p className="text-sm font-medium text-foreground/40 max-w-md mx-auto">
                You lack the required security clearance (settings.read) to inspect enterprise platform configuration.
              </p>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-5">
        <CommandHeader
          title="System Configuration"
          description="Configure platform-wide parameters, security protocols, and integration architectures."
        >
          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadSettings()}
              disabled={isLoading || isSaving}
              className="flex items-center space-x-3 px-6 py-3.5 rounded-[22px] bg-surface-elevated border border-border text-white text-[11px] font-black uppercase tracking-widest hover:bg-surface-elevated transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Nodes</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving || !canWrite}
              title={!canWrite ? "Required permission: settings.write" : "Commit active section changes"}
              className={cn(
                "flex items-center space-x-3 h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50",
                canWrite
                  ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90"
                  : "bg-foreground/5 border border-border text-foreground/30 cursor-not-allowed"
              )}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Committing..." : "Commit Changes"}</span>
            </button>
          </div>
        </CommandHeader>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          {/* Sidebar Navigation */}
          <div className="xl:col-span-1 space-y-2">
            {sections.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={cn(
                    "w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-sm text-left",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-surface border border-border text-foreground/40 hover:text-foreground hover:bg-surface-elevated hover:bg-foreground/5"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-foreground/20")} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="xl:col-span-3 space-y-10">
            {isLoading ? (
              <LoadingState message="Synchronizing Platform Configuration Core..." />
            ) : missingTableInfo.isMissing ? (
              <MissingTableState tableName={missingTableInfo.name} migrationSql={missingTableInfo.sql} />
            ) : isError ? (
              <ErrorState onRetry={loadSettings} />
            ) : (
              <section className="p-10 rounded-[40px] bg-card-bg border border-border space-y-10 shadow-premium relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                {activeSection === "general_settings" && (
                  <>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight leading-none">General Settings</h3>
                      <p className="text-[13px] text-foreground/40 mt-3 leading-relaxed font-medium">
                        Core enterprise identity and monetary configuration parameters.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Enterprise Name</label>
                        <input
                          value={form.general_settings.enterprise_name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              general_settings: { ...prev.general_settings, enterprise_name: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Support Vector Email</label>
                        <input
                          type="email"
                          value={form.general_settings.support_email}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              general_settings: { ...prev.general_settings, support_email: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Yield Fee Coefficient (%)</label>
                        <input
                          type="number"
                          value={form.general_settings.yield_fee_coefficient}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              general_settings: { ...prev.general_settings, yield_fee_coefficient: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Fiscal Currency</label>
                        <input
                          value={form.general_settings.currency}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              general_settings: { ...prev.general_settings, currency: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "security_settings" && (
                  <>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight leading-none">Security Settings</h3>
                      <p className="text-[13px] text-foreground/40 mt-3 leading-relaxed font-medium">
                        Authentication thresholds, session rules, and security overrides.
                      </p>
                    </div>
                    <div className="space-y-6">
                      <div
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            security_settings: { ...prev.security_settings, require_admin_2fa: !prev.security_settings.require_admin_2fa },
                          }))
                        }
                        className="flex items-center justify-between p-6 rounded-3xl bg-surface-elevated border border-border hover:bg-surface-elevated hover:bg-foreground/5 transition-colors shadow-sm cursor-pointer"
                      >
                        <div>
                          <p className="text-[14px] font-black text-foreground tracking-tight leading-none">Require Admin 2FA</p>
                          <p className="text-[12px] font-medium text-foreground/30 mt-2">Mandate Two-Factor Authentication across all administrative logins.</p>
                        </div>
                        <div
                          className={cn(
                            "w-14 h-7 rounded-full transition-colors relative shadow-lg flex-shrink-0 ml-4",
                            form.security_settings.require_admin_2fa ? "bg-primary border-primary/20 shadow-primary/20" : "bg-surface-elevated border-border"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                              form.security_settings.require_admin_2fa ? "right-1" : "left-1 opacity-50"
                            )}
                          />
                        </div>
                      </div>

                      <div
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            security_settings: { ...prev.security_settings, allow_owner_override: !prev.security_settings.allow_owner_override },
                          }))
                        }
                        className="flex items-center justify-between p-6 rounded-3xl bg-surface-elevated border border-border hover:bg-surface-elevated hover:bg-foreground/5 transition-colors shadow-sm cursor-pointer"
                      >
                        <div>
                          <p className="text-[14px] font-black text-foreground tracking-tight leading-none">Allow Owner Security Override</p>
                          <p className="text-[12px] font-medium text-foreground/30 mt-2">Permit platform owners to bypass standard session restrictions during outages.</p>
                        </div>
                        <div
                          className={cn(
                            "w-14 h-7 rounded-full transition-colors relative shadow-lg flex-shrink-0 ml-4",
                            form.security_settings.allow_owner_override ? "bg-primary border-primary/20 shadow-primary/20" : "bg-surface-elevated border-border"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                              form.security_settings.allow_owner_override ? "right-1" : "left-1 opacity-50"
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Max Login Attempts</label>
                          <input
                            type="number"
                            value={form.security_settings.max_login_attempts}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                security_settings: { ...prev.security_settings, max_login_attempts: e.target.value },
                              }))
                            }
                            className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Session Timeout (Minutes)</label>
                          <input
                            type="number"
                            value={form.security_settings.session_timeout_minutes}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                security_settings: { ...prev.security_settings, session_timeout_minutes: e.target.value },
                              }))
                            }
                            className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "notification_settings" && (
                  <>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight leading-none">Notification Settings</h3>
                      <p className="text-[13px] text-foreground/40 mt-3 leading-relaxed font-medium">
                        Enterprise event routing and system alert dispatch controls.
                      </p>
                    </div>
                    <div className="space-y-6">
                      {[
                        { key: "email_notifications" as const, title: "Outbound Email Dispatch", desc: "Allow platform to transmit transactional email notifications." },
                        { key: "approval_alerts" as const, title: "Creator/Brand Approval Alerts", desc: "Notify moderation administrators instantly upon KYC submission." },
                        { key: "payment_alerts" as const, title: "Escrow & Payment Alerts", desc: "Trigger financial ledger alerts on escrow release or refund actions." },
                        { key: "security_alerts" as const, title: "Security Threat Alerts", desc: "Broadcast immediate warnings upon multiple failed authentication attempts." },
                      ].map((item) => {
                        const checked = form.notification_settings[item.key];
                        return (
                          <div
                            key={item.key}
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                notification_settings: { ...prev.notification_settings, [item.key]: !checked },
                              }))
                            }
                            className="flex items-center justify-between p-6 rounded-3xl bg-surface-elevated border border-border hover:bg-surface-elevated hover:bg-foreground/5 transition-colors shadow-sm cursor-pointer"
                          >
                            <div>
                              <p className="text-[14px] font-black text-foreground tracking-tight leading-none">{item.title}</p>
                              <p className="text-[12px] font-medium text-foreground/30 mt-2">{item.desc}</p>
                            </div>
                            <div
                              className={cn(
                                "w-14 h-7 rounded-full transition-colors relative shadow-lg flex-shrink-0 ml-4",
                                checked ? "bg-primary border-primary/20 shadow-primary/20" : "bg-surface-elevated border-border"
                              )}
                            >
                              <div
                                className={cn(
                                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                                  checked ? "right-1" : "left-1 opacity-50"
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {activeSection === "email_smtp_settings" && (
                  <>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight leading-none">Email SMTP Architecture</h3>
                      <p className="text-[13px] text-foreground/40 mt-3 leading-relaxed font-medium">
                        SMTP gateway routing parameters for outbound mail transmission.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">SMTP Host</label>
                        <input
                          value={form.email_smtp_settings.smtp_host}
                          placeholder="smtp.sendgrid.net"
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              email_smtp_settings: { ...prev.email_smtp_settings, smtp_host: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">SMTP Port</label>
                        <input
                          type="number"
                          value={form.email_smtp_settings.smtp_port}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              email_smtp_settings: { ...prev.email_smtp_settings, smtp_port: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">SMTP Username</label>
                        <input
                          value={form.email_smtp_settings.smtp_username}
                          placeholder="apikey / username"
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              email_smtp_settings: { ...prev.email_smtp_settings, smtp_username: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">SMTP From Email</label>
                        <input
                          type="email"
                          value={form.email_smtp_settings.smtp_from_email}
                          placeholder="noreply@ugc-fy.in"
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              email_smtp_settings: { ...prev.email_smtp_settings, smtp_from_email: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <div
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          email_smtp_settings: { ...prev.email_smtp_settings, smtp_secure: !prev.email_smtp_settings.smtp_secure },
                        }))
                      }
                      className="flex items-center justify-between p-6 rounded-3xl bg-surface-elevated border border-border hover:bg-surface-elevated hover:bg-foreground/5 transition-colors shadow-sm cursor-pointer mt-6"
                    >
                      <div>
                        <p className="text-[14px] font-black text-foreground tracking-tight leading-none">Use TLS/SSL Protocol (Secure)</p>
                        <p className="text-[12px] font-medium text-foreground/30 mt-2">Enforce secure TLS transmission encryption for all outgoing mail packets.</p>
                      </div>
                      <div
                        className={cn(
                          "w-14 h-7 rounded-full transition-colors relative shadow-lg flex-shrink-0 ml-4",
                          form.email_smtp_settings.smtp_secure ? "bg-primary border-primary/20 shadow-primary/20" : "bg-surface-elevated border-border"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                            form.email_smtp_settings.smtp_secure ? "right-1" : "left-1 opacity-50"
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "database_settings" && (
                  <>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight leading-none">Database & Realtime Core</h3>
                      <p className="text-[13px] text-foreground/40 mt-3 leading-relaxed font-medium">
                        PostgreSQL query execution controls and Supabase realtime channel management.
                      </p>
                    </div>
                    <div className="space-y-6">
                      {[
                        { key: "realtime_enabled" as const, title: "Supabase Realtime Broadcast", desc: "Enable live database change streams across connected client instances." },
                        { key: "daily_backup_enabled" as const, title: "Automated Daily Snapshot", desc: "Trigger automated point-in-time recovery backup generation nightly." },
                        { key: "schema_cache_reload" as const, title: "Dynamic Schema Cache Reloading", desc: "Notify PostgREST schema cache reload automatically on metadata mutations." },
                      ].map((item) => {
                        const checked = form.database_settings[item.key];
                        return (
                          <div
                            key={item.key}
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                database_settings: { ...prev.database_settings, [item.key]: !checked },
                              }))
                            }
                            className="flex items-center justify-between p-6 rounded-3xl bg-surface-elevated border border-border hover:bg-surface-elevated hover:bg-foreground/5 transition-colors shadow-sm cursor-pointer"
                          >
                            <div>
                              <p className="text-[14px] font-black text-foreground tracking-tight leading-none">{item.title}</p>
                              <p className="text-[12px] font-medium text-foreground/30 mt-2">{item.desc}</p>
                            </div>
                            <div
                              className={cn(
                                "w-14 h-7 rounded-full transition-colors relative shadow-lg flex-shrink-0 ml-4",
                                checked ? "bg-primary border-primary/20 shadow-primary/20" : "bg-surface-elevated border-border"
                              )}
                            >
                              <div
                                className={cn(
                                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                                  checked ? "right-1" : "left-1 opacity-50"
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <div className="space-y-3 pt-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">PostgreSQL Query Timeout (Seconds)</label>
                        <input
                          type="number"
                          value={form.database_settings.query_timeout_seconds}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              database_settings: { ...prev.database_settings, query_timeout_seconds: e.target.value },
                            }))
                          }
                          className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner max-w-md"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "mobile_app_settings" && (
                  <>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight leading-none">Mobile App Gateway</h3>
                      <p className="text-[13px] text-foreground/40 mt-3 leading-relaxed font-medium">
                        Client release protocols, platform feature flags, and maintenance banners.
                      </p>
                    </div>
                    <div className="space-y-6">
                      {[
                        { key: "android_enabled" as const, title: "Android Client Gateway", desc: "Allow Android APK/AAB instances to authenticate and query platform endpoints." },
                        { key: "ios_enabled" as const, title: "iOS Client Gateway", desc: "Allow iOS App Store instances to authenticate and query platform endpoints." },
                        { key: "force_update" as const, title: "Force Mandatory Update", desc: "Require all active mobile instances below minimum version to update immediately." },
                      ].map((item) => {
                        const checked = form.mobile_app_settings[item.key];
                        return (
                          <div
                            key={item.key}
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                mobile_app_settings: { ...prev.mobile_app_settings, [item.key]: !checked },
                              }))
                            }
                            className="flex items-center justify-between p-6 rounded-3xl bg-surface-elevated border border-border hover:bg-surface-elevated hover:bg-foreground/5 transition-colors shadow-sm cursor-pointer"
                          >
                            <div>
                              <p className="text-[14px] font-black text-foreground tracking-tight leading-none">{item.title}</p>
                              <p className="text-[12px] font-medium text-foreground/30 mt-2">{item.desc}</p>
                            </div>
                            <div
                              className={cn(
                                "w-14 h-7 rounded-full transition-colors relative shadow-lg flex-shrink-0 ml-4",
                                checked ? "bg-primary border-primary/20 shadow-primary/20" : "bg-surface-elevated border-border"
                              )}
                            >
                              <div
                                className={cn(
                                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                                  checked ? "right-1" : "left-1 opacity-50"
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Minimum Client Version</label>
                          <input
                            value={form.mobile_app_settings.minimum_app_version}
                            placeholder="1.0.0"
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                mobile_app_settings: { ...prev.mobile_app_settings, minimum_app_version: e.target.value },
                              }))
                            }
                            className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Maintenance Lockout Message</label>
                          <input
                            value={form.mobile_app_settings.maintenance_message}
                            placeholder="Scheduled infrastructure maintenance in progress..."
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                mobile_app_settings: { ...prev.mobile_app_settings, maintenance_message: e.target.value },
                              }))
                            }
                            className="w-full bg-surface-elevated border border-border text-foreground font-black text-[13px] h-14 rounded-2xl px-5 focus:outline-none focus:border-primary/30 focus:bg-surface-elevated hover:bg-foreground/5 transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
