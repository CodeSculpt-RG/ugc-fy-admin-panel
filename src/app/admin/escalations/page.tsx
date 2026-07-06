"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { EmptyState } from "@/app/components/shared/EmptyState";
import { PageHeader } from "@/app/components/ui/core";
import { 
  Search, 
  RefreshCw, 
  X, 
  MessageSquare, 
  Download, 
  SlidersHorizontal,
  ExternalLink,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Info
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/app/hooks/useToast";
import { LoadingState, ErrorState } from "@/app/components/ui/shared-states";

interface ProfileLink {
  id: string;
  email: string;
  platform_id: string | null;
  role: string;
  full_name: string | null;
}

interface EscalationRecord {
  id: string;
  conversation_id: string | null;
  message_id: string | null;
  campaign_id: string | null;
  raised_by_profile_id: string | null;
  against_profile_id: string | null;
  creator_profile_id: string | null;
  brand_profile_id: string | null;
  issue_type: string;
  title: string | null;
  description: string | null;
  priority: string;
  status: string;
  attachment_url: string | null;
  admin_notes: string | null;
  resolved_by_admin_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  raised_by?: ProfileLink | null;
  against?: ProfileLink | null;
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) return JSON.stringify(error);
  return String(error);
}

function formatIssueType(type: string): string {
  const labels: Record<string, string> = {
    behaviour: "Behaviour",
    payment: "Payment",
    deliverables: "Deliverables",
    safety_concern: "Safety Concern",
    payment_delay: "Payment Delay",
    approval_delay: "Approval Delay",
    safety_issue: "Safety Issue",
    inappropriate_message: "Inappropriate Message",
    content_delivery_issue: "Content Delivery Issue",
    other: "Other",
  };
  if (labels[type]) return labels[type];
  if (!type) return "General Issue";
  return type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface StatsType {
  open: number;
  underReview: number;
  resolved: number;
  urgent: number;
}

const COPY = {
  filter: "Filter",
  export: "Export",
  sync: "Sync",
  tableMissingTitle: "Escalations table missing in current Supabase project",
  tableMissingPrefix: "The database table",
  tableMissingName: "public.chat_escalations",
  tableMissingSuffix:
    "could not be found. Please ensure that all schema migrations are applied and the Supabase PostgREST schema cache is reloaded.",
  openEscalations: "Open Escalations",
  underReview: "Under Review",
  resolvedCases: "Resolved Cases",
  urgentPriority: "Urgent Priority",
  allStatuses: "All Statuses",
  open: "Open",
  resolved: "Resolved",
  rejected: "Rejected",
  allPriorities: "All Priorities",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
  allIssueTypes: "All Issue Types",
  behaviour: "Behaviour",
  payment: "Payment",
  deliverables: "Deliverables",
  safetyConcern: "Safety Concern",
  paymentDelay: "Payment Delay",
  approvalDelay: "Approval Delay",
  safetyIssue: "Safety Issue",
  inappropriateMessage: "Inappropriate Message",
  contentDeliveryIssue: "Content Delivery Issue",
  other: "Other",
  allDates: "All Dates",
  today: "Today",
  past7Days: "Past 7 Days",
  past30Days: "Past 30 Days",
  issue: "Issue",
  raisedBy: "Raised By",
  against: "Against",
  priority: "Priority",
  status: "Status",
  created: "Created",
  actions: "Actions",
  noEscalations: "No escalations yet",
  noEscalationsBody: "New chat reports will appear here when users raise an issue.",
  view: "View",
  detailsTitle: "Escalation Report Details",
  rolePrefix: "Role:",
  noProfileLinked: "No profile linked",
  incidentContext: "Incident Context",
  campaignLink: "Campaign Link",
  conversationId: "Conversation ID",
  attachedMedia: "Attached Media",
  viewFile: "View File",
  controlProtocol: "Incident Control Protocol",
  priorityRating: "Priority Rating",
  investigationStatus: "Investigation Status",
  auditLog: "Investigation Audit Log",
  saveNotes: "Save Notes",
  openChat: "Open Chat",
  noChatLink: "No Chat Link",
  reject: "Reject",
  resolveCase: "Resolve Case",
} as const;

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationRecord | null>(null);
  const [adminNotesText, setAdminNotesText] = useState("");
  const { showToast } = useToast();

  const fetchEscalations = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setIsError(false);
      setIsTableMissing(false);
      
      let escalationQuery = supabase
        .from('chat_escalations')
        .select('*')
        .order('created_at', { ascending: false });

      if (signal) {
        escalationQuery = escalationQuery.abortSignal(signal);
      }

      const { data: escalationsData, error: escalationsError } = await escalationQuery;
        
      if (escalationsError) throw escalationsError;
      
      // Normalize records dynamically to handle both old and new schema columns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawRecords = (escalationsData || []) as any[];
      const normalizedRecords: EscalationRecord[] = rawRecords.map(raw => {
        // Raised by profile can be profile_id or raised_by_profile_id
        const raisedBy = raw.profile_id || raw.raised_by_profile_id || null;
        
        return {
          id: raw.id,
          conversation_id: raw.conversation_id || null,
          message_id: raw.message_id || null,
          campaign_id: raw.campaign_id || null,
          raised_by_profile_id: raisedBy,
          against_profile_id: raw.against_profile_id || null,
          creator_profile_id: raw.creator_profile_id || null,
          brand_profile_id: raw.brand_profile_id || null,
          issue_type: raw.issue_type || raw.role || 'general_escalation',
          title: raw.title || raw.subject || 'Support Escalation',
          description: raw.description || raw.message || null,
          priority: raw.priority || 'medium',
          status: raw.status || 'open',
          attachment_url: raw.attachment_url || null,
          admin_notes: raw.admin_notes || raw.resolution_note || null,
          resolved_by_admin_id: raw.resolved_by_admin_id || raw.assigned_to || null,
          resolved_at: raw.resolved_at || null,
          created_at: raw.created_at,
          updated_at: raw.updated_at,
        };
      });

      // Extract all profile IDs involved for a safe client-side join
      const profileIds = new Set<string>();
      normalizedRecords.forEach(esc => {
        if (esc.raised_by_profile_id) profileIds.add(esc.raised_by_profile_id);
        if (esc.against_profile_id) profileIds.add(esc.against_profile_id);
      });

      const profilesMap = new Map<string, ProfileLink>();
      if (profileIds.size > 0) {
        let profilesQuery = supabase
          .from('profiles')
          .select('id, email, platform_id, role, full_name')
          .in('id', Array.from(profileIds));

        if (signal) {
          profilesQuery = profilesQuery.abortSignal(signal);
        }

        const { data: profilesData } = await profilesQuery;

        if (profilesData) {
          const castedProfiles = profilesData as unknown as ProfileLink[];
          castedProfiles.forEach(p => {
            profilesMap.set(p.id, p);
          });
        }
      }

      // Map profiles onto escalations
      const mapped = normalizedRecords.map(esc => ({
        ...esc,
        raised_by: esc.raised_by_profile_id ? profilesMap.get(esc.raised_by_profile_id) ?? null : null,
        against: esc.against_profile_id ? profilesMap.get(esc.against_profile_id) ?? null : null,
      }));

      setEscalations(mapped);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      const errMsg = normalizeError(e);
      const isMissing = errMsg.includes("PGRST205") || 
                       errMsg.includes("42P01") || 
                       errMsg.includes("relation \"chat_escalations\" does not exist") || 
                       errMsg.includes("does not exist");
      
      if (isMissing) {
        setIsTableMissing(true);
        console.warn('chat_escalations table missing in current Supabase project');
      } else {
        console.error('[Escalations] Error loading escalations:', errMsg);
        setIsError(true);
        showToast("Failed to load escalations", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void fetchEscalations(controller.signal);
      }
    });
    return () => controller.abort(new DOMException("Escalations request cancelled", "AbortError"));
  }, [fetchEscalations]);

  const selectEscalation = (esc: EscalationRecord) => {
    setSelectedEscalation(esc);
    setAdminNotesText(esc.admin_notes || "");
  };

  const filteredEscalations = useMemo(() => {
    let result = [...escalations];

    if (search.trim() !== "") {
      const term = search.toLowerCase();
      result = result.filter(esc => {
        const issueText = (esc.title || esc.description || esc.issue_type || "").toLowerCase();
        const raisedByText = esc.raised_by
          ? `${esc.raised_by.email || ""} ${esc.raised_by.platform_id || ""} ${esc.raised_by.full_name || ""}`.toLowerCase()
          : "";
        const againstText = esc.against
          ? `${esc.against.email || ""} ${esc.against.platform_id || ""} ${esc.against.full_name || ""}`.toLowerCase()
          : "";
        const campaignText = (esc.campaign_id || "").toLowerCase();

        return (
          issueText.includes(term) ||
          raisedByText.includes(term) ||
          againstText.includes(term) ||
          campaignText.includes(term)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter(esc => esc.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter(esc => esc.priority === priorityFilter);
    }

    if (issueTypeFilter !== "all") {
      result = result.filter(esc => esc.issue_type === issueTypeFilter);
    }

    if (dateRangeFilter !== "all") {
      const now = new Date();
      result = result.filter(esc => {
        const created = new Date(esc.created_at);
        const diffMs = now.getTime() - created.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (dateRangeFilter === "today") return diffDays <= 1;
        if (dateRangeFilter === "week") return diffDays <= 7;
        if (dateRangeFilter === "month") return diffDays <= 30;
        return true;
      });
    }

    return result;
  }, [escalations, search, statusFilter, priorityFilter, issueTypeFilter, dateRangeFilter]);

  // Aggregate stats dynamically
  const stats = useMemo<StatsType>(() => {
    let open = 0;
    let underReview = 0;
    let resolved = 0;
    let urgent = 0;

    escalations.forEach(esc => {
      if (esc.status === 'open') open++;
      else if (esc.status === 'under_review') underReview++;
      else if (esc.status === 'resolved') resolved++;

      if (esc.priority === 'urgent' && esc.status !== 'resolved') urgent++;
    });

    return { open, underReview, resolved, urgent };
  }, [escalations]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chat_escalations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showToast("Incident status updated", "success");
      setEscalations(prev => prev.map(esc => esc.id === id ? { ...esc, status: newStatus } : esc));
      if (selectedEscalation?.id === id) {
        setSelectedEscalation(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e: unknown) {
      console.error('[Escalations] Status update error:', normalizeError(e));
      showToast("Failed to update status", "error");
    }
  };

  const updatePriority = async (id: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('chat_escalations')
        .update({ priority: newPriority })
        .eq('id', id);

      if (error) throw error;
      showToast("Incident priority updated", "success");
      setEscalations(prev => prev.map(esc => esc.id === id ? { ...esc, priority: newPriority } : esc));
      if (selectedEscalation?.id === id) {
        setSelectedEscalation(prev => prev ? { ...prev, priority: newPriority } : null);
      }
    } catch (e: unknown) {
      console.error('[Escalations] Priority update error:', normalizeError(e));
      showToast("Failed to update priority", "error");
    }
  };

  const updateNotes = async (id: string) => {
    try {
      let { error } = await supabase
        .from('chat_escalations')
        .update({ admin_notes: adminNotesText })
        .eq('id', id);

      if (error && (error.code === '42703' || error.message?.includes('admin_notes'))) {
        // Fallback to new schema column resolution_note
        const { error: fallbackError } = await supabase
          .from('chat_escalations')
          .update({ resolution_note: adminNotesText })
          .eq('id', id);
        
        if (fallbackError) throw fallbackError;
        error = null;
      } else if (error) {
        throw error;
      }

      showToast("Admin notes saved", "success");
      setEscalations(prev => prev.map(esc => esc.id === id ? { ...esc, admin_notes: adminNotesText } : esc));
      if (selectedEscalation?.id === id) {
        setSelectedEscalation(prev => prev ? { ...prev, admin_notes: adminNotesText } : null);
      }
    } catch (e: unknown) {
      console.error('[Escalations] Notes update error:', normalizeError(e));
      showToast("Failed to save notes", "error");
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ["ID", "Issue Type", "Title", "Description", "Priority", "Status", "Raised By Profile", "Against Profile", "Created At"];
      const rows = filteredEscalations.map(esc => [
        esc.id,
        esc.issue_type || "",
        esc.title || "",
        esc.description || "",
        esc.priority || "medium",
        esc.status || "open",
        esc.raised_by ? esc.raised_by.email : esc.raised_by_profile_id || "",
        esc.against ? esc.against.email : esc.against_profile_id || "",
        new Date(esc.created_at).toISOString(),
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `chat_escalations_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Data exported successfully", "success");
    } catch (e: unknown) {
      console.error('[Escalations] Export error:', e);
      showToast("Failed to export data", "error");
    }
  };

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Escalations" 
          subtitle="Manage active support escalations and chat disputes."
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(prev => !prev)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-95 ${
                showFilters 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-surface border-border text-foreground hover:bg-foreground/5"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{COPY.filter}</span>
            </button>
            <button 
              onClick={exportToCSV}
              disabled={isLoading || filteredEscalations.length === 0}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-surface border border-border text-foreground text-xs font-bold hover:bg-foreground/5 transition-all active:scale-95 disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>{COPY.export}</span>
            </button>
            <button 
              onClick={() => void fetchEscalations()}
              disabled={isLoading}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>{COPY.sync}</span>
            </button>
          </div>
        </PageHeader>

        {isTableMissing ? (
          <div className="p-8 rounded-[32px] bg-error/10 border border-error/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mx-auto text-error">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">{COPY.tableMissingTitle}</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                {COPY.tableMissingPrefix} <code>{COPY.tableMissingName}</code> {COPY.tableMissingSuffix}
              </p>
            </div>
          </div>
        ) : isError ? (
          <ErrorState onRetry={fetchEscalations} />
        ) : (
          <>
            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="p-6 rounded-[28px] bg-surface border border-border shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{COPY.openEscalations}</span>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-3xl font-black text-foreground">{stats.open}</span>
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[28px] bg-surface border border-border shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{COPY.underReview}</span>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-3xl font-black text-foreground">{stats.underReview}</span>
                  <div className="p-2.5 rounded-xl bg-foreground/5 border border-border text-foreground/60">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[28px] bg-surface border border-border shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{COPY.resolvedCases}</span>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-3xl font-black text-foreground">{stats.resolved}</span>
                  <div className="p-2.5 rounded-xl bg-foreground/5 border border-border text-foreground/40">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[28px] bg-surface border border-border shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{COPY.urgentPriority}</span>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-3xl font-black text-primary">{stats.urgent}</span>
                  <div className="p-2.5 rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search + Filters Module */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-surface border border-border rounded-[28px] shadow-sm mb-8 animate-fade-in">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input 
                    type="text" 
                    placeholder="Search by issue, creator, brand, email, platform ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="all">{COPY.allStatuses}</option>
                    <option value="open">{COPY.open}</option>
                    <option value="under_review">{COPY.underReview}</option>
                    <option value="resolved">{COPY.resolved}</option>
                    <option value="rejected">{COPY.rejected}</option>
                  </select>
                </div>

                <div>
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="all">{COPY.allPriorities}</option>
                    <option value="low">{COPY.low}</option>
                    <option value="medium">{COPY.medium}</option>
                    <option value="high">{COPY.high}</option>
                    <option value="urgent">{COPY.urgent}</option>
                  </select>
                </div>

                <div>
                  <select 
                    value={issueTypeFilter}
                    onChange={(e) => setIssueTypeFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="all">{COPY.allIssueTypes}</option>
                    <option value="behaviour">{COPY.behaviour}</option>
                    <option value="payment">{COPY.payment}</option>
                    <option value="deliverables">{COPY.deliverables}</option>
                    <option value="safety_concern">{COPY.safetyConcern}</option>
                    <option value="payment_delay">{COPY.paymentDelay}</option>
                    <option value="approval_delay">{COPY.approvalDelay}</option>
                    <option value="safety_issue">{COPY.safetyIssue}</option>
                    <option value="inappropriate_message">{COPY.inappropriateMessage}</option>
                    <option value="content_delivery_issue">{COPY.contentDeliveryIssue}</option>
                    <option value="other">{COPY.other}</option>
                  </select>
                </div>

                <div className="md:col-span-4">
                  <select 
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="all">{COPY.allDates}</option>
                    <option value="today">{COPY.today}</option>
                    <option value="week">{COPY.past7Days}</option>
                    <option value="month">{COPY.past30Days}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Table Area */}
            <div className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto rounded-2xl custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
                  <thead className="bg-surface border-b border-border text-[9px] uppercase tracking-widest text-text-secondary">
                    <tr>
                      <th className="px-8 py-5 font-black">{COPY.issue}</th>
                      <th className="px-8 py-5 font-black">{COPY.raisedBy}</th>
                      <th className="px-8 py-5 font-black">{COPY.against}</th>
                      <th className="px-8 py-5 font-black">{COPY.priority}</th>
                      <th className="px-8 py-5 font-black">{COPY.status}</th>
                      <th className="px-8 py-5 font-black">{COPY.created}</th>
                      <th className="px-8 py-5 font-black text-right">{COPY.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-24 text-center">
                          <LoadingState message="Synchronizing active escalations..." className="min-h-0 py-0" />
                        </td>
                      </tr>
                    ) : filteredEscalations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <EmptyState title={COPY.noEscalations} description={COPY.noEscalationsBody} className="my-10 border-0" />
                        </td>
                      </tr>
                    ) : (
                      filteredEscalations.map((esc) => {
                        const raisedEmail = esc.raised_by?.email || "Unknown";
                        const againstEmail = esc.against?.email || "Unknown";

                        return (
                          <tr 
                            key={esc.id} 
                            onClick={() => selectEscalation(esc)}
                            className="hover:bg-foreground/[0.02] active:bg-foreground/[0.03] transition-all cursor-pointer group"
                          >
                            <td className="px-8 py-5 font-semibold text-foreground">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-foreground">
                                  {esc.title || formatIssueType(esc.issue_type)}
                                </span>
                                {esc.description && (
                                  <span className="text-[10px] text-text-secondary font-medium truncate max-w-xs mt-1">
                                    {esc.description}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-text-secondary text-xs">
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground/80">{raisedEmail}</span>
                                {esc.raised_by?.platform_id && (
                                  <span className="text-[10px] text-text-secondary mt-0.5 font-mono">{esc.raised_by.platform_id}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-text-secondary text-xs">
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground/80">{againstEmail}</span>
                                {esc.against?.platform_id && (
                                  <span className="text-[10px] text-text-secondary mt-0.5 font-mono">{esc.against.platform_id}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                esc.priority === "urgent" ? "bg-primary border-primary text-white" :
                                esc.priority === "high" ? "bg-primary/10 border-primary/40 text-primary font-bold" :
                                esc.priority === "low" ? "bg-foreground/5 border-border text-text-secondary font-semibold" :
                                "bg-primary/5 border-primary/20 text-primary"
                              }`}>
                                {esc.priority || "medium"}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                esc.status === "resolved" ? "bg-foreground/[0.02] border-border text-text-secondary line-through" :
                                esc.status === "under_review" ? "bg-foreground/5 border-border text-foreground font-semibold" :
                                esc.status === "rejected" ? "bg-foreground/[0.02] border-border text-text-secondary" :
                                "bg-primary/5 border-primary text-primary"
                              }`}>
                                {esc.status || "open"}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-text-secondary text-[11px] font-medium">
                              {new Date(esc.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button className="px-3.5 py-1.5 bg-surface-elevated border border-border hover:border-primary/40 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider text-text-secondary hover:text-foreground active:scale-95">
                                {COPY.view}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Drawer */}
      {selectedEscalation && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedEscalation(null)}
          />
          <div className="relative w-full max-w-xl bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{COPY.detailsTitle}</h3>
              </div>
              <button 
                onClick={() => setSelectedEscalation(null)}
                className="p-2 hover:bg-foreground/5 border border-border rounded-xl transition-all active:scale-95"
              >
                <X className="w-4 h-4 text-foreground/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {/* Core Case Information */}
              <div className="p-6 rounded-[24px] bg-surface-elevated border border-border space-y-3">
                <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                  {formatIssueType(selectedEscalation.issue_type)}
                </span>
                <h4 className="text-lg font-bold text-foreground">
                  {selectedEscalation.title || formatIssueType(selectedEscalation.issue_type)}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  {selectedEscalation.description || "No description provided."}
                </p>
              </div>

              {/* Raised By and Against Profiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-elevated border border-border flex flex-col justify-between">
                  <div className="flex items-center space-x-2 text-text-secondary mb-2">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{COPY.raisedBy}</span>
                  </div>
                  {selectedEscalation.raised_by ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground truncate">{selectedEscalation.raised_by.full_name || "Platform User"}</p>
                      <p className="text-[10px] text-text-secondary font-medium truncate">{selectedEscalation.raised_by.email}</p>
                      <p className="text-[9px] text-text-secondary font-mono mt-1 uppercase tracking-wide">{COPY.rolePrefix} {selectedEscalation.raised_by.role}</p>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-text-secondary italic">{COPY.noProfileLinked}</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-surface-elevated border border-border flex flex-col justify-between">
                  <div className="flex items-center space-x-2 text-text-secondary mb-2">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{COPY.against}</span>
                  </div>
                  {selectedEscalation.against ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground truncate">{selectedEscalation.against.full_name || "Platform User"}</p>
                      <p className="text-[10px] text-text-secondary font-medium truncate">{selectedEscalation.against.email}</p>
                      <p className="text-[9px] text-text-secondary font-mono mt-1 uppercase tracking-wide">{COPY.rolePrefix} {selectedEscalation.against.role}</p>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-text-secondary italic">{COPY.noProfileLinked}</p>
                  )}
                </div>
              </div>

              {/* Linked Metadata Context */}
              <div className="space-y-3">
                <h5 className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{COPY.incidentContext}</h5>
                <div className="space-y-2">
                  {selectedEscalation.campaign_id && (
                    <div className="flex justify-between items-center py-2 px-4 bg-surface-elevated border border-border rounded-xl text-xs font-medium text-foreground">
                      <span className="text-text-secondary text-[10px]">{COPY.campaignLink}</span>
                      <span className="font-mono text-[10px] text-foreground/80">{selectedEscalation.campaign_id}</span>
                    </div>
                  )}
                  {selectedEscalation.conversation_id && (
                    <div className="flex justify-between items-center py-2 px-4 bg-surface-elevated border border-border rounded-xl text-xs font-medium text-foreground">
                      <span className="text-text-secondary text-[10px]">{COPY.conversationId}</span>
                      <span className="font-mono text-[10px] text-foreground/80">{selectedEscalation.conversation_id}</span>
                    </div>
                  )}
                  {selectedEscalation.attachment_url && (
                    <div className="flex justify-between items-center py-2.5 px-4 bg-surface-elevated border border-border rounded-xl text-xs font-medium">
                      <span className="text-text-secondary text-[10px]">{COPY.attachedMedia}</span>
                      <a 
                        href={selectedEscalation.attachment_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-primary hover:text-primary/95 text-[10px] font-bold uppercase tracking-wider"
                      >
                        <span>{COPY.viewFile}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Protocol & Control Suite */}
              <div className="border-t border-border pt-6 space-y-4">
                <h5 className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{COPY.controlProtocol}</h5>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 flex flex-col">
                    <span className="text-[10px] font-bold text-foreground">{COPY.priorityRating}</span>
                    <select 
                      value={selectedEscalation.priority}
                      onChange={(e) => updatePriority(selectedEscalation.id, e.target.value)}
                      className="px-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-all"
                    >
                      <option value="low">{COPY.low}</option>
                      <option value="medium">{COPY.medium}</option>
                      <option value="high">{COPY.high}</option>
                      <option value="urgent">{COPY.urgent}</option>
                    </select>
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <span className="text-[10px] font-bold text-foreground">{COPY.investigationStatus}</span>
                    <select 
                      value={selectedEscalation.status}
                      onChange={(e) => updateStatus(selectedEscalation.id, e.target.value)}
                      className="px-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-all"
                    >
                      <option value="open">{COPY.open}</option>
                      <option value="under_review">{COPY.underReview}</option>
                      <option value="resolved">{COPY.resolved}</option>
                      <option value="rejected">{COPY.rejected}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Admin Internal Investigation Notes */}
              <div className="border-t border-border pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{COPY.auditLog}</span>
                  <button 
                    onClick={() => updateNotes(selectedEscalation.id)}
                    className="px-4 py-1.5 bg-foreground text-background hover:bg-foreground/90 transition-all font-bold text-[9px] uppercase tracking-wider rounded-lg"
                  >
                    {COPY.saveNotes}
                  </button>
                </div>
                <textarea 
                  rows={4}
                  placeholder="Insert internal investigation details, chat audit logs or action notes here..."
                  value={adminNotesText}
                  onChange={(e) => setAdminNotesText(e.target.value)}
                  className="w-full p-4 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none leading-relaxed transition-all"
                />
              </div>
            </div>

            {/* Sticky Actions Bar */}
            <div className="p-6 border-t border-border bg-surface-elevated flex items-center justify-between">
              {selectedEscalation.conversation_id ? (
                <a 
                  href={`/admin/chat-monitoring?conversationId=${selectedEscalation.conversation_id}`}
                  className="inline-flex items-center space-x-2 px-5 py-3.5 bg-foreground hover:bg-foreground/90 text-background rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{COPY.openChat}</span>
                </a>
              ) : (
                <div className="flex items-center space-x-2 text-text-secondary bg-surface border border-border px-4 py-2.5 rounded-xl">
                  <Info className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">{COPY.noChatLink}</span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => updateStatus(selectedEscalation.id, "rejected")}
                  className="px-5 py-3.5 border border-border hover:border-primary/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-foreground transition-all active:scale-95"
                >
                  {COPY.reject}
                </button>
                <button 
                  onClick={() => updateStatus(selectedEscalation.id, "resolved")}
                  className="px-5 py-3.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                  {COPY.resolveCase}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
