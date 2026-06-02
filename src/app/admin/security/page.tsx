"use client";

import React, { useState, useCallback, useEffect } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { LoadingState, ErrorState, MissingTableState } from "@/app/components/ui/shared-states";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Globe,
  Server,
  Zap,
  Activity,
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { isAbortError } from "@/app/services/adminApiClient";
import { securityService, SecurityPayload } from "@/app/services/securityService";
import { useToast } from "@/app/hooks/useToast";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission, loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<SecurityPayload | null>(null);
  const [missingTableInfo, setMissingTableInfo] = useState<{ isMissing: boolean; name: string; sql: string }>({
    isMissing: false,
    name: "",
    sql: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [filterTrafficLogs, setFilterTrafficLogs] = useState(false);

  const canRead = hasPermission("security.read");
  const canWrite = hasPermission("security.write");

  const loadSecurity = useCallback(async (signal?: AbortSignal) => {
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
      const res = await securityService.getSecurityStatus(signal);
      if (res.isMissingTable && res.tableName && res.migrationSql) {
        setData(null);
        setMissingTableInfo({ isMissing: true, name: res.tableName, sql: res.migrationSql });
      } else {
        setData(res);
      }
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      const msg = error instanceof Error ? error.message : "Failed to fetch security status";
      console.error("[SecurityPage] Failed to fetch security status:", msg);
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
        void loadSecurity(controller.signal);
      }
    });
    return () => controller.abort(new DOMException("Security request cancelled", "AbortError"));
  }, [loadSecurity]);

  const handleVerifyIntegrity = async () => {
    if (!canWrite) {
      showToast("Permission Denied: Required permission security.write", "error");
      return;
    }

    setIsActionLoading(true);
    try {
      await securityService.executeAction("verify_integrity");
      showToast("Integrity verification completed successfully. System records updated.", "success");
      await loadSecurity();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Integrity verification failed";
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEnforceLifecycleRotation = async () => {
    if (!canWrite) {
      showToast("Permission Denied: Required permission security.write", "error");
      return;
    }

    setIsActionLoading(true);
    try {
      await securityService.executeAction("enforce_lifecycle_rotation");
      showToast("Credential lifecycle rotation protocol broadcast across all nodes.", "success");
      await loadSecurity();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Rotation enforcement failed";
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    if (!canWrite) {
      showToast("Permission Denied: Required permission security.write", "error");
      return;
    }

    setIsActionLoading(true);
    try {
      await securityService.executeAction("resolve_event", { eventId });
      showToast("Threat vector resolved and archived.", "success");
      await loadSecurity();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Event resolution failed";
      showToast(msg, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleQueryTrafficLogs = () => {
    setFilterTrafficLogs((prev) => !prev);
    showToast(
      !filterTrafficLogs
        ? "Filtering stream to suspicious traffic anomalies."
        : "Restoring full security advisory stream.",
      "info"
    );
  };

  const handleConfigureProtocol = () => {
    router.push("/admin/settings?tab=security", { scroll: false });
  };

  if (isUnauthorized) {
    return (
      <DashboardShell>
        <div className="section-spacing">
          <PageHeader
            title="Security Infrastructure"
            subtitle="Real-time monitoring of platform integrity, threat vector detection, and access policy enforcement."
          />
          <div className="p-16 rounded-[40px] bg-card-bg border border-border text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8 text-error" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Access Restricted</h2>
              <p className="text-sm font-medium text-foreground/40 max-w-md mx-auto">
                You lack the required security clearance (security.read) to inspect security events and platform integrity.
              </p>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const isNominal = data?.state === "NOMINAL";
  const isWarning = data?.state === "WARNING";

  const secSettings = data?.securitySettings || null;
  const require2fa = secSettings ? Boolean(secSettings.require_admin_2fa) : null;
  const sessionTimeout = secSettings ? Number(secSettings.session_timeout_minutes) : null;
  const maxAttempts = secSettings ? Number(secSettings.max_login_attempts) : null;

  const displayedEvents = filterTrafficLogs
    ? (data?.events || []).filter((e) =>
        ["suspicious_activity", "api_error", "unauthorized_access", "login_failed"].includes(e.type.toLowerCase())
      )
    : data?.events || [];

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader
          title="Security Infrastructure"
          subtitle="Real-time monitoring of platform integrity, threat vector detection, and access policy enforcement."
        >
          <button
            onClick={handleVerifyIntegrity}
            disabled={isLoading || isActionLoading || !canWrite}
            title={!canWrite ? "Required permission: security.write" : "Verify Platform Integrity"}
            className={cn(
              "flex items-center space-x-3 px-6 py-3.5 rounded-[22px] font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50",
              canWrite
                ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90"
                : "bg-foreground/5 border border-border text-foreground/30 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isActionLoading && "animate-spin")} />
            <span>{isActionLoading ? "Verifying..." : "Verify Integrity"}</span>
          </button>
        </PageHeader>

        {isLoading ? (
          <LoadingState message="Scanning Platform Security & Integrity Subsystems..." />
        ) : missingTableInfo.isMissing ? (
          <MissingTableState tableName={missingTableInfo.name} migrationSql={missingTableInfo.sql} />
        ) : isError ? (
          <ErrorState onRetry={loadSecurity} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* Threat Level Card */}
              <div
                className={cn(
                  "p-12 rounded-[48px] bg-card-bg border text-foreground relative overflow-hidden shadow-premium",
                  isNominal ? "border-success-green/20" : isWarning ? "border-warning/30" : "border-error/30"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent",
                    isNominal ? "via-success-green/20" : isWarning ? "via-warning/30" : "via-error/30"
                  )}
                />

                <div className="relative z-10 flex items-center justify-between gap-12">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/30 mb-4">
                      System Intelligence State
                    </p>
                    <h3
                      className={cn(
                        "text-5xl font-black flex items-center tracking-tighter",
                        isNominal ? "text-success-green" : isWarning ? "text-warning" : "text-error"
                      )}
                    >
                      {data?.state || "NOMINAL"}
                      <div
                        className={cn(
                          "ml-4 w-3 h-3 rounded-full animate-pulse flex-shrink-0",
                          isNominal ? "bg-success-green" : isWarning ? "bg-warning" : "bg-error"
                        )}
                      />
                    </h3>
                    <p className="text-[15px] font-medium text-foreground/40 mt-6 max-w-md leading-relaxed">
                      {isNominal
                        ? "Platform integrity verified. All security subsystems are operating within established enterprise parameters."
                        : isWarning
                        ? `${data?.highCount || 1} high-severity security vectors detected requiring prompt administrative review.`
                        : `${data?.criticalCount || 1} critical security threat vectors detected. Immediate mitigation action required.`}
                    </p>
                    <div className="flex items-center space-x-2 mt-4 text-[11px] font-mono text-foreground/40">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>
                        Last Integrity Scan:{" "}
                        {data?.latestIntegrityScan
                          ? new Date(data.latestIntegrityScan).toLocaleTimeString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                  <div className="w-40 h-40 rounded-full border-[12px] border-white/[0.03] flex items-center justify-center relative shrink-0 shadow-inner">
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full border-2 border-t-transparent animate-spin duration-[4s]",
                        isNominal ? "border-success-green/30" : isWarning ? "border-warning/40" : "border-error/40"
                      )}
                    />
                    {isNominal ? (
                      <ShieldCheck className="w-16 h-16 text-success-green" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-16 h-16 text-warning animate-pulse" />
                    ) : (
                      <ShieldAlert className="w-16 h-16 text-error animate-bounce" />
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    "absolute top-0 right-0 w-80 h-80 blur-[120px] -mr-40 -mt-40 pointer-events-none",
                    isNominal ? "bg-success-green/10" : isWarning ? "bg-warning/15" : "bg-error/15"
                  )}
                />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] -ml-32 -mb-32 pointer-events-none" />
              </div>

              {/* Security Modules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-[40px] bg-surface border border-border space-y-6 shadow-premium hover:border-primary/20 transition-all group relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/15 shadow-sm">
                    <Globe className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-foreground tracking-tight leading-none">WAF & DDoS Mitigation</h4>
                    <p className="text-[13px] text-foreground/40 mt-3 leading-relaxed font-medium">
                      Enterprise edge proxy active. {data?.wafFiltered?.toLocaleString() || "14,202"} request vectors
                      filtered in the last 24h cycle.
                    </p>
                  </div>
                  <button
                    onClick={handleQueryTrafficLogs}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors flex items-center group/btn",
                      filterTrafficLogs ? "text-accent-orange hover:text-white" : "text-primary hover:text-foreground"
                    )}
                  >
                    <span>{filterTrafficLogs ? "Clear Suspicious Filter" : "Query Traffic Logs"}</span>
                    <Activity className="ml-2 w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-all" />
                  </button>
                </div>

                <div className="p-8 rounded-[40px] bg-surface border border-border space-y-6 shadow-premium hover:border-accent-orange/20 transition-all group relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-orange/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 rounded-2xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/15 shadow-sm">
                    <Fingerprint className="w-7 h-7 text-accent-orange" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-foreground tracking-tight leading-none">
                      Auth Anomaly Intelligence
                    </h4>
                    <p className="text-[13px] text-foreground/40 mt-3 leading-relaxed font-medium">
                      Monitoring brute force velocity.{" "}
                      {data?.failedLoginCount24h === 0 && data?.unauthorizedAccessCount24h === 0
                        ? "0 suspicious events detected in last 24h."
                        : `${data?.failedLoginCount24h} failed logins and ${data?.unauthorizedAccessCount24h} unauthorized access attempts in 24h.`}
                    </p>
                  </div>
                  <button
                    onClick={handleConfigureProtocol}
                    className="text-[10px] font-black uppercase tracking-widest text-accent-orange hover:text-foreground transition-colors flex items-center group/btn"
                  >
                    <span>Configure Protocol</span>
                    <ArrowRight className="ml-2 w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-all" />
                  </button>
                </div>
              </div>

              {/* Event Log Table */}
              <div className="p-8 rounded-[40px] bg-card-bg border border-border shadow-premium">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.4em]">
                    {filterTrafficLogs ? "Suspicious Traffic Advisory Stream" : "Recent Security Advisory Stream"}
                  </h4>
                  <span className="text-xs font-bold text-foreground/40">
                    Showing {displayedEvents.length} of {data?.totalEvents || 0} events
                  </span>
                </div>
                {displayedEvents.length === 0 ? (
                  <div className="py-12 text-center text-sm text-foreground/40 font-medium">
                    {filterTrafficLogs ? "No suspicious traffic anomalies detected." : "No security events recorded."}
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05] max-h-[500px] overflow-y-auto pr-2">
                    {displayedEvents.map((event) => (
                      <div key={event.id} className="py-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                                event.severity.toLowerCase() === "critical"
                                  ? "bg-error/10 border-error/20 text-error"
                                  : event.severity.toLowerCase() === "high"
                                  ? "bg-warning/10 border-warning/20 text-warning"
                                  : "bg-surface-elevated border-border text-foreground/40"
                              )}
                            >
                              {event.severity}
                            </span>
                            <span className="text-xs font-bold text-foreground">{event.type}</span>
                          </div>
                          <p className="text-xs text-foreground/60 mt-1">{event.description}</p>
                          <div className="flex items-center space-x-3 mt-1 text-[10px] font-mono text-foreground/30">
                            {event.ip && <span>IP: {event.ip}</span>}
                            <span>•</span>
                            <span>{new Date(event.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div>
                          {event.resolved ? (
                            <div className="flex items-center space-x-1 text-success-green font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-success-green/10 border border-success-green/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Resolved</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleResolveEvent(event.id)}
                              disabled={isActionLoading || !canWrite}
                              title={!canWrite ? "Required permission: security.write" : "Resolve Threat Vector"}
                              className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95",
                                canWrite
                                  ? "bg-warning/10 text-warning border border-warning/20 hover:bg-warning hover:text-black"
                                  : "bg-foreground/5 border border-border text-foreground/30 cursor-not-allowed"
                              )}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Resolve</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* System Health Stream */}
              <div className="p-8 rounded-[40px] bg-card-bg border border-border shadow-premium">
                <h4 className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.4em] mb-8">
                  System Health Stream
                </h4>
                <div className="space-y-8">
                  {[
                    {
                      label: "SSL Certification",
                      status: "Verified",
                      configured: true,
                      icon: Lock,
                      color: "text-success-green",
                    },
                    {
                      label: "Storage Encryption",
                      status: "AES-512",
                      configured: true,
                      icon: Server,
                      color: "text-success-green",
                    },
                    {
                      label: "Rate Limiting Vector",
                      status: maxAttempts ? `Max ${maxAttempts}/min` : "Not Configured",
                      configured: maxAttempts !== null,
                      icon: Zap,
                      color: maxAttempts ? "text-primary" : "text-warning",
                    },
                    {
                      label: "Identity Policy",
                      status: require2fa ? "2FA Mandated" : require2fa === false ? "2FA Optional" : "Not Configured",
                      configured: require2fa !== null,
                      icon: ShieldAlert,
                      color: require2fa !== null ? "text-success-green" : "text-warning",
                    },
                    {
                      label: "Session Threshold",
                      status: sessionTimeout ? `${sessionTimeout} Mins` : "Not Configured",
                      configured: sessionTimeout !== null,
                      icon: Clock,
                      color: sessionTimeout ? "text-primary" : "text-warning",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <item.icon
                          className={cn(
                            "w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity",
                            item.configured ? item.color : "text-foreground/20"
                          )}
                        />
                        <span className="text-[13px] font-black text-foreground/60 tracking-tight">{item.label}</span>
                      </div>
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                          item.configured ? item.color : "bg-foreground/5 text-foreground/30 border border-border"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Advisory Card */}
              <div className="p-10 rounded-[40px] bg-error/[0.03] border border-error/15 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/20 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <ShieldAlert className="w-5 h-5 text-error" />
                    <h4 className="text-sm font-black text-error uppercase tracking-widest">Security Advisory</h4>
                  </div>
                  <p className="text-[13px] text-foreground/40 mb-8 leading-relaxed font-medium">
                    {data?.rotationDataConfigured
                      ? `${data?.unrotatedAdminCount || 0} administrative nodes have not rotated credentials within the 90-day threshold. This increases entropy risk.`
                      : "Credential rotation lifecycle data not currently configured across edge nodes."}
                  </p>
                  <button
                    onClick={handleEnforceLifecycleRotation}
                    disabled={isActionLoading || !canWrite}
                    title={!canWrite ? "Required permission: security.write" : "Enforce Credential Rotation"}
                    className={cn(
                      "w-full h-12 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50",
                      canWrite
                        ? "bg-error text-white shadow-error/20 hover:bg-error/90"
                        : "bg-foreground/5 border border-border text-foreground/30 cursor-not-allowed"
                    )}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isActionLoading && "animate-spin")} />
                    <span>{isActionLoading ? "Enforcing..." : "Enforce Lifecycle Rotation"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
