import { supabase } from "@/lib/supabase/client";
import { ModerationItem, RiskLevel } from "@/app/types";

export type ModerationPayload = {
  data: ModerationItem[];
  count: number;
  isMissingTable?: boolean;
  tableName?: string;
  migrationSql?: string;
};

type RawModerationCase = {
  id: string;
  case_type: string;
  status: string;
  priority: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}

export const moderationService = {
  getQueue: async (): Promise<ModerationPayload> => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch('/api/admin/moderation', { headers });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Protocol failure: unable to fetch moderation queue.");
    }

    const rawList: RawModerationCase[] = Array.isArray(payload.data) ? payload.data : [];
    const mappedItems: ModerationItem[] = rawList.map((raw: RawModerationCase): ModerationItem => {
      const meta = (raw.metadata || {}) as Record<string, string>;
      let typeVal: "Video" | "Bio" | "Comment" | "Image" = "Video";
      if (raw.case_type === "profile") typeVal = "Bio";
      else if (raw.case_type === "message") typeVal = "Comment";
      else if (raw.case_type === "brand_content") typeVal = "Image";

      let statusVal: "AI Flagged" | "User Reported" | "Pending Review" | "Restricted" | "Resolved" | "Dismissed" = "Pending Review";
      if (raw.status === "pending" || raw.status === "reviewing") statusVal = "Pending Review";
      else if (raw.status === "resolved") statusVal = "Resolved";
      else if (raw.status === "dismissed") statusVal = "Dismissed";
      else if (raw.status === "escalated") statusVal = "User Reported";

      let riskVal: RiskLevel = "Medium";
      if (raw.priority === "low") riskVal = "Low";
      else if (raw.priority === "high" || raw.priority === "critical") riskVal = "High";

      return {
        id: raw.id,
        type: typeVal,
        title: raw.title || "Platform Security Incident",
        creator: meta.creator_name || "Platform User",
        campaign: meta.campaign_name || "Global Ecosystem",
        status: statusVal,
        risk: riskVal,
        thumbnail: meta.thumbnail_url,
        content: raw.description || raw.title || "No description provided.",
        timestamp: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      };
    });

    return {
      data: mappedItems,
      count: payload.count || mappedItems.length,
      isMissingTable: payload.isMissingTable,
      tableName: payload.tableName,
      migrationSql: payload.migrationSql,
    };
  },

  resolveCase: async (id: string, status: string, reason?: string) => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error("Administrative session required.");

    const response = await fetch(`/api/admin/moderation/${id}/resolve`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status, reason })
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Directive rejected: unable to update moderation case.");
    }

    return payload.data;
  }
};
