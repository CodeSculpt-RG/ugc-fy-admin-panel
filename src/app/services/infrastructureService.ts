import { supabase } from "@/lib/supabase/client";

export type TableStatusItem = {
  tableName: string;
  status: "Nominal" | "Degraded";
  recordsCount: number;
};

export type InfrastructurePayload = {
  latencyMs: number;
  uptimePercentage: number;
  activeNodes: number;
  region: string;
  databaseVersion: string;
  tableStatuses: TableStatusItem[];
  lastVerifiedAt: string;
};

export const infrastructureService = {
  getInfrastructureHealth: async (): Promise<InfrastructurePayload> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/infrastructure", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Failed to probe infrastructure.");
    }

    return payload.data;
  },
};
