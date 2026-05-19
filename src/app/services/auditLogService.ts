import { supabase } from "@/lib/supabase/client";

export type AuditLogItem = {
  id: string;
  admin: string;
  action: string;
  target: string;
  severity: string;
  ip: string;
  device: string;
  timestamp: string;
};

export type AuditLogPayload = {
  data: AuditLogItem[];
  count: number;
  isMissingTable?: boolean;
  tableName?: string;
  migrationSql?: string;
};

export const auditLogService = {
  getLogs: async (): Promise<AuditLogPayload> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/audit-logs", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Failed to fetch audit logs.");
    }

    return {
      data: payload.data || [],
      count: payload.count || 0,
      isMissingTable: payload.isMissingTable,
      tableName: payload.tableName,
      migrationSql: payload.migrationSql,
    };
  },
};
