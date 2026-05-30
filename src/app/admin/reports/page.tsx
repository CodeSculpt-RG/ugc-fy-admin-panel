"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";
import {
  FileText,
  Download,
  Mail,
  Filter,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
  Settings2,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { reportService, ReportItem } from "@/app/services/reportService";
import { useToast } from "@/app/hooks/useToast";
import { CreateReportModal } from "@/app/components/modals/CreateReportModal";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ReportsPage() {
  const { showToast } = useToast();
  const { hasPermission, loading: authLoading } = useAdminAuth();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [automationSettings, setAutomationSettings] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingLink, setIsTestingLink] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNodesModalOpen, setIsNodesModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const canRead = hasPermission("reports.read");
  const canWrite = hasPermission("reports.write");

  const loadReports = useCallback(async (showNotification = false) => {
    if (authLoading) return;
    if (!canRead) {
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    if (showNotification) setIsSyncing(true);
    else setIsLoading(true);

    setIsError(false);
    setIsUnauthorized(false);

    try {
      const data = await reportService.getReports();
      setReports(data.data);
      setAutomationSettings(data.automationSettings || null);
      if (showNotification) showToast("Intelligence repository synchronized successfully.", "success");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to fetch reports";
      console.error("[ReportsPage] Failed to fetch reports:", msg);
      if (msg.includes("permission") || msg.includes("unauthorized") || msg.includes("DENIED")) {
        setIsUnauthorized(true);
      } else {
        setIsError(true);
        showToast("Infrastructure synchronization failed.", "error");
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [authLoading, canRead, showToast]);

  useEffect(() => {
    // eslint-disable-next-line
    loadReports();
  }, [loadReports]);

  const handleTestLink = async () => {
    setIsTestingLink(true);
    try {
      const res = await reportService.testLink();
      showToast(res.message, "success");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Transmission link verification failed.";
      showToast(msg, "error");
    } finally {
      setIsTestingLink(false);
    }
  };

  const handleBrowseColdStorage = () => {
    setSelectedStatus("Ready");
    document.getElementById("reports-ledger")?.scrollIntoView({ behavior: "smooth" });
    showToast("Filtered ledger to Ready/Archived compliance packages.", "info");
  };

  const handleDownload = (id: string, url?: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank");
    }
    showToast(`Downloading verified intelligence package ID_${id.slice(0, 8)}`, "info");
  };

  const handleView = (id: string, url?: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank");
    } else {
      showToast(`Opening report ID_${id.slice(0, 8)} in secure compliance viewer`, "info");
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchType = selectedType === "All" || r.type.toLowerCase() === selectedType.toLowerCase();
      const matchStatus = selectedStatus === "All" || r.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchType && matchStatus;
    });
  }, [reports, selectedType, selectedStatus]);

  if (isUnauthorized) {
    return (
      <DashboardShell>
        <div className="section-spacing">
          <PageHeader
            title="Intelligence Repository"
            subtitle="Access automated business compliance, operational audits, and forensic platform reports."
          />
          <div className="p-16 rounded-[40px] bg-card-bg border border-border text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8 text-error" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Access Restricted</h2>
              <p className="text-sm font-medium text-foreground/40 max-w-md mx-auto">
                You lack the required administrative clearance (reports.read) to view the intelligence ledger.
              </p>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader
          title="Intelligence Repository"
          subtitle="Access automated business compliance, operational audits, and forensic platform reports."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button
              onClick={() => loadReports(true)}
              disabled={isLoading || isSyncing}
              className="flex items-center justify-center space-x-3 h-12 px-6 rounded-[22px] bg-surface-elevated border border-border text-white text-[11px] font-black uppercase tracking-widest hover:bg-surface-elevated transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Syncing..." : "Sync Repository"}</span>
            </button>
            <button
              onClick={() => {
                if (!canWrite) {
                  showToast("Permission Denied: Required permission reports.write", "error");
                  return;
                }
                setIsModalOpen(true);
              }}
              disabled={!canWrite}
              title={!canWrite ? "Required permission: reports.write" : "Generate Report"}
              className={cn(
                "h-12 px-8 rounded-[22px] font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center",
                canWrite
                  ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90"
                  : "bg-foreground/5 border border-border text-foreground/30 cursor-not-allowed"
              )}
            >
              Generate Report
            </button>
          </div>
        </PageHeader>

        {/* 2-Column Cards Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-10">
          <div className="p-8 sm:p-10 rounded-[40px] bg-surface border border-border relative overflow-hidden group shadow-sm flex flex-col justify-between">
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Automated Dispatch</p>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-none">
                Transmission Configuration
              </h3>
              <p className="text-[13px] text-foreground/40 max-w-sm leading-relaxed font-medium">
                Configure high-priority dispatch protocols for automated fiscal and compliance intelligence directly to executive stakeholders.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8 relative z-10">
              <button
                onClick={() => setIsNodesModalOpen(true)}
                className="h-11 px-6 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Manage Nodes</span>
              </button>
              <button
                onClick={handleTestLink}
                disabled={isTestingLink}
                className="h-11 px-6 rounded-xl bg-surface-elevated border border-border text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>{isTestingLink ? "Testing..." : "Test Link"}</span>
              </button>
            </div>
            <FileText className="absolute right-[-40px] bottom-[-40px] w-56 h-56 text-primary opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          </div>

          <div className="p-8 sm:p-10 rounded-[40px] bg-surface border border-border relative overflow-hidden group shadow-sm flex flex-col justify-between">
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Lifecycle Retention</p>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-none">
                Historical Archives
              </h3>
              <p className="text-[13px] text-foreground/40 max-w-sm leading-relaxed font-medium">
                Access and restore platform compliance reports from previous fiscal periods. All platform data is secured via daily cold storage.
              </p>
            </div>
            <div className="flex items-center mt-8 relative z-10">
              <button
                onClick={handleBrowseColdStorage}
                className="w-full sm:w-auto h-11 px-8 rounded-xl bg-surface-elevated border border-border text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Browse Cold Storage</span>
              </button>
            </div>
            <Download className="absolute right-[-40px] bottom-[-40px] w-56 h-56 text-white opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          </div>
        </div>

        {/* Ledger Section */}
        <div id="reports-ledger" className="bg-card-bg border border-border rounded-[40px] overflow-hidden shadow-premium relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="px-6 sm:px-10 py-8 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/[0.01]">
            <div>
              <h4 className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.4em]">
                Generated Intelligence Ledger
              </h4>
              <p className="text-xs text-foreground/40 font-semibold mt-1">
                Showing {filteredReports.length} of {reports.length} compliance packages
              </p>
            </div>
            <button
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={cn(
                "flex items-center justify-center space-x-2.5 px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                isFilterOpen
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-surface-elevated border-border text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isFilterOpen ? "Hide Filters" : "Configure Filter"}</span>
            </button>
          </div>

          {/* Filter Drawer */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-border bg-white/[0.01] px-6 sm:px-10 py-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] block mb-2">
                      Report Vector Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full h-11 rounded-xl bg-surface border border-border px-3 text-xs text-foreground font-semibold uppercase tracking-wider focus:outline-none focus:border-primary"
                    >
                      <option value="All">All Vectors</option>
                      <option value="Financial">Financial</option>
                      <option value="User">User</option>
                      <option value="Campaign">Campaign</option>
                      <option value="Security">Security</option>
                      <option value="Dispute">Dispute</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] block mb-2">
                      Protocol Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full h-11 rounded-xl bg-surface border border-border px-3 text-xs text-foreground font-semibold uppercase tracking-wider focus:outline-none focus:border-primary"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Ready">Ready</option>
                      <option value="Generating">Generating</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    {(selectedType !== "All" || selectedStatus !== "All") && (
                      <button
                        onClick={() => {
                          setSelectedType("All");
                          setSelectedStatus("All");
                        }}
                        className="w-full h-11 rounded-xl bg-foreground/5 border border-border text-foreground/60 hover:text-white font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="p-12">
              <LoadingState message="Synchronizing Compliance Packages..." />
            </div>
          ) : isError ? (
            <div className="p-12">
              <ErrorState onRetry={() => loadReports(false)} />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 max-w-sm mx-auto">
              <div className="p-5 rounded-[24px] bg-foreground/[0.03] border border-border">
                <FileText className="w-8 h-8 text-text-secondary animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-foreground">No reports generated yet.</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Platform audits and analytics reports will appear here when generated by admins.
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-20 text-center text-xs font-black uppercase tracking-[0.3em] text-foreground/30">
              No compliance reports matching active criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-elevated">
                    <th className="px-6 sm:px-10 py-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Report Identifier
                    </th>
                    <th className="px-6 sm:px-10 py-6 text-xs font-semibold uppercase tracking-wider text-text-secondary whitespace-nowrap">
                      Vector
                    </th>
                    <th className="px-6 sm:px-10 py-6 text-xs font-semibold uppercase tracking-wider text-text-secondary whitespace-nowrap">
                      Protocol State
                    </th>
                    <th className="px-6 sm:px-10 py-6 text-xs font-semibold uppercase tracking-wider text-text-secondary whitespace-nowrap">
                      Temporal Origin
                    </th>
                    <th className="px-6 sm:px-10 py-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="group hover:bg-surface-elevated transition-colors duration-300">
                      <td className="px-6 sm:px-10 py-6 min-w-0">
                        <div className="flex items-center space-x-4 sm:space-x-5 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-500 shadow-sm flex-shrink-0">
                            <FileText className="w-5 h-5 text-foreground/20 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-[15px] font-black text-foreground tracking-tight leading-none truncate">
                              {report.name}
                            </p>
                            <p className="text-[10px] text-foreground/40 mt-1 truncate font-medium">
                              {report.description}
                            </p>
                            <p className="text-[10px] text-foreground/20 uppercase font-black tracking-widest mt-2 truncate">
                              ID_{report.id.slice(0, 8)} <span className="mx-1.5 opacity-50">•</span> {report.reporter}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-6 whitespace-nowrap">
                        <span className="text-[10px] font-black text-foreground/60 uppercase tracking-widest bg-surface-elevated px-3 py-1.5 rounded-lg border border-border">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 sm:px-10 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {report.status.toLowerCase() === "ready" ? (
                            <CheckCircle2 className="w-4 h-4 text-success-green flex-shrink-0" />
                          ) : report.status.toLowerCase() === "generating" ? (
                            <RefreshCw className="w-4 h-4 text-warning animate-spin flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                          )}
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              report.status.toLowerCase() === "ready"
                                ? "text-success-green"
                                : report.status.toLowerCase() === "generating"
                                ? "text-warning"
                                : "text-error"
                            )}
                          >
                            {report.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-6 whitespace-nowrap">
                        <span className="text-[11px] font-black text-foreground/40 uppercase tracking-wider">
                          {report.date}
                        </span>
                      </td>
                      <td className="px-6 sm:px-10 py-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDownload(report.id, report.fileUrl)}
                            disabled={report.status.toLowerCase() !== "ready"}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-elevated border border-border text-foreground/40 hover:bg-white hover:text-black hover:border-white transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated disabled:hover:text-foreground/40 disabled:hover:border-border"
                            title={report.status.toLowerCase() === "ready" ? "Download Package" : "Package Generating"}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleView(report.id, report.fileUrl)}
                            disabled={report.status.toLowerCase() !== "ready"}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-elevated border border-border text-foreground/40 hover:bg-white hover:text-black hover:border-white transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated disabled:hover:text-foreground/40 disabled:hover:border-border"
                            title={report.status.toLowerCase() === "ready" ? "View Secure Package" : "Package Generating"}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Generate Report Modal */}
        <CreateReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => loadReports(true)}
        />

        {/* Manage Nodes Modal */}
        <AnimatePresence>
          {isNodesModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNodesModalOpen(false)}
                className="absolute inset-0 bg-background/70 backdrop-blur-md z-[200]"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-[201] w-full max-w-[500px] bg-card-bg border border-border rounded-[32px] sm:rounded-[40px] shadow-2xl p-8 overflow-hidden space-y-6 text-center"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <button
                  onClick={() => setIsNodesModalOpen(false)}
                  className="absolute right-6 top-6 p-2 rounded-2xl bg-surface-elevated border border-border text-foreground/40 hover:text-white hover:bg-foreground/10 transition-all outline-none"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-inner">
                  <Settings2 className="w-8 h-8 text-primary" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Transmission Dispatch Nodes</h3>
                  <p className="text-xs font-medium text-foreground/40">
                    Configuration settings for automated compliance dispatch nodes across executive communication vectors.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-surface-elevated border border-border text-left space-y-4">
                  {automationSettings ? (
                    <div className="space-y-3 text-xs font-mono text-foreground/70">
                      <div>
                        <span className="text-foreground/30 uppercase font-black text-[10px] block">Dispatch Protocol</span>
                        <span>{String(automationSettings.protocol || "Secure SMTP & Webhook Vector")}</span>
                      </div>
                      <div>
                        <span className="text-foreground/30 uppercase font-black text-[10px] block">Cron Frequency</span>
                        <span>{String(automationSettings.cron || "0 0 * * 0 (Weekly Fiscal Summary)")}</span>
                      </div>
                      <div>
                        <span className="text-foreground/30 uppercase font-black text-[10px] block">Encryption Standard</span>
                        <span>{String(automationSettings.encryption || "AES-GCM-256 (FIPS 140-2)")}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-foreground/40">
                      Automation settings not configured
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsNodesModalOpen(false)}
                  className="w-full h-12 rounded-2xl bg-foreground/5 border border-border font-black text-xs uppercase tracking-widest text-white hover:bg-foreground/10 transition-all"
                >
                  Close Panel
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
