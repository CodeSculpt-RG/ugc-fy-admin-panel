import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { adminFetch, isAbortError } from "@/app/services/adminApiClient";
import { normalizeError } from "@/lib/api/normalizeError";
import debounce from "es-toolkit/compat/debounce";

export interface ActivityLog {
  id: string;
  actor_admin_id: string;
  actor_user_id: string | null;
  target_admin_id: string | null;
  module: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ActivityFilter {
  scope: "own" | "team" | "all";
  page: number;
  pageSize: number;
  module?: string;
  action?: string;
  from?: string;
  to?: string;
}

export interface ActivityResponse {
  data: ActivityLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  permissions: {
    canReadOwn: boolean;
    canReadTeam: boolean;
    canReadAll: boolean;
  };
}

export function useAdminActivity(initialFilter: ActivityFilter) {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<ActivityResponse["pagination"]>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [permissions, setPermissions] = useState<ActivityResponse["permissions"]>({
    canReadOwn: true, // Optimistic UI, refined by response
    canReadTeam: false,
    canReadAll: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [filter, setFilter] = useState<ActivityFilter>(initialFilter);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchActivity = useCallback(
    async (currentFilter: ActivityFilter) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          scope: currentFilter.scope,
          page: currentFilter.page.toString(),
          pageSize: currentFilter.pageSize.toString(),
        });
        
        if (currentFilter.module) params.append("module", currentFilter.module);
        if (currentFilter.action) params.append("action", currentFilter.action);
        if (currentFilter.from) params.append("from", currentFilter.from);
        if (currentFilter.to) params.append("to", currentFilter.to);

        const response = await adminFetch(
          `/api/admin/profile/activity?${params.toString()}`,
          { signal: controller.signal }
        );

        let json;
        try {
          json = await response.json();
        } catch {
          throw new Error("Failed to parse API response.");
        }

        if (!response.ok || !json.ok) {
          const errMsg = json.error?.message || "Failed to load activity logs.";
          const err = new Error(errMsg) as Error & { code?: string };
          err.code = json.error?.code;
          throw err;
        }

        const data = json;

        setData(data.data);
        setPagination(data.pagination);
        setPermissions(data.permissions);

      } catch (err: unknown) {
        if (!isAbortError(err)) {
          setError(normalizeError(err) as unknown as Error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Use debounce for cases where filters update rapidly
  const debouncedFetch = useMemo(
    // eslint-disable-next-line react-hooks/refs
    () => debounce((f: ActivityFilter) => fetchActivity(f), 300),
    [fetchActivity]
  );

  useEffect(() => {
    debouncedFetch(filter);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filter, debouncedFetch]);

  return {
    data,
    pagination,
    permissions,
    loading,
    error,
    filter,
    setFilter,
    refresh: () => fetchActivity(filter)
  };
}
