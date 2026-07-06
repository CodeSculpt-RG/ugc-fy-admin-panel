"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { setCookie, deleteCookie } from "cookies-next";
import type { AdminPermission } from "@/lib/api/adminPermissions";
import type { AdminUser } from "@/lib/auth/admin-types";
import { useAuthStore } from "@/app/store/authStore";
import type { Session } from "@supabase/supabase-js";

interface AdminAuthContextValue {
  admin: AdminUser | null;
  session: Session | null;
  status: "checking" | "authenticated" | "unauthenticated" | "unknown";
  loading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  refreshAdmin: (force?: boolean) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isLikelyNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message === "Failed to fetch" ||
    error.message.includes("NetworkError") ||
    error.message.includes("Load failed")
  );
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout } = useAuthStore();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AdminAuthContextValue["status"]>("checking");
  const [loading, setLoading] = useState(true);
  const activeTokenRef = useRef<string | null>(null);

  const handleLogout = useCallback(() => {
    deleteCookie("admin-token");
    setAdmin(null);
    setSession(null);
    setStatus("unauthenticated");
    logout();
    activeTokenRef.current = null;
  }, [logout]);

  const refreshAdmin = useCallback(async (
    currentSession?: Session | null,
    signal?: AbortSignal,
    force = false
  ) => {
    try {
      const activeSession = currentSession !== undefined 
        ? currentSession 
        : (await supabase.auth.getSession()).data.session;

      if (!activeSession?.access_token) {
        setLoading(false);
        handleLogout();
        return;
      }

      setCookie("admin-token", activeSession.access_token, { maxAge: 60 * 60 * 12, path: "/" });

      if (!force && activeTokenRef.current === activeSession.access_token) {
        setLoading(false);
        return;
      }
      activeTokenRef.current = activeSession.access_token;

      let response: Response;
      try {
        response = await fetch("/api/admin/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: activeSession?.access_token
            ? { Authorization: `Bearer ${activeSession.access_token}` }
            : {},
          signal,
        });
      } catch (fetchErr: unknown) {
        if (isAbortError(fetchErr)) {
          return;
        }
        const msg = fetchErr instanceof Error ? fetchErr.message : "Unknown error";

        if (isLikelyNetworkFetchError(fetchErr)) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Admin session refresh skipped due to transient network issue:", msg);
          }
          setStatus(admin ? "authenticated" : "unknown");
          setLoading(false);
          return;
        }

        console.error("Unexpected admin session refresh fetch error:", msg);
        setStatus(admin ? "authenticated" : "unknown");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn("[AdminAuthContext] me check rejected, status:", response.status);
          handleLogout();
          await supabase.auth.signOut();
        } else {
          console.warn("[AdminAuthContext] me check unavailable, status:", response.status);
          setStatus(admin ? "authenticated" : "unknown");
        }
        setLoading(false);
        return;
      }

      const payload = await response.json();
      if (payload.ok && payload.admin) {
        setAdmin(payload.admin);
        setStatus("authenticated");
        // Map AdminUser to AuthAdminUser format expected by Zustand authStore
        const storeAdmin = {
          id: payload.admin.id,
          email: payload.admin.email,
          role: payload.admin.role.toUpperCase(), // Match old UI's uppercase expectations
          name: payload.admin.full_name || payload.admin.email.split("@")[0],
          full_name: payload.admin.full_name,
          permissions: [] as string[], 
          isActive: payload.admin.status === "active",
        };
        type AuthStoreParam = Parameters<typeof setAuth>[0];
        setAuth(storeAdmin as unknown as AuthStoreParam, activeSession.access_token);
      } else {
        setStatus(admin ? "authenticated" : "unknown");
      }
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      console.error("[AdminAuthContext] refreshAdmin failed:", err);
      setStatus(admin ? "authenticated" : "unknown");
    } finally {
      setLoading(false);
    }
  }, [admin, setAuth, handleLogout]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    // Get initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("[AdminAuthContext] getSession failed:", error);
      }
      const s = data.session;
      setSession(s);
      if (s?.access_token) {
        refreshAdmin(s, controller.signal).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setStatus("unauthenticated");
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession?.access_token) {
        refreshAdmin(nextSession, controller.signal);
      } else {
        handleLogout();
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      controller.abort();
      subscription.unsubscribe();
    };
  }, [refreshAdmin, handleLogout]);

  const hasPermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (!admin) return false;
      const roleStr = admin.role.toLowerCase();
      if (roleStr === "owner" || roleStr === "super_admin") return true;
      
      // Fallback/role permission map
      const permissionsMap: Record<string, AdminPermission[]> = {
        admin: ["dashboard.read", "users.read", "creators.read", "brands.read", "campaigns.read", "moderation.read", "payments.read", "escrow.read", "disputes.read", "support.read", "analytics.read", "reports.read", "settings.read", "profile.read", "profile.update"],
        kyc_manager: ["dashboard.read", "users.read", "creators.read", "kyc.read" as AdminPermission, "kyc.review" as AdminPermission, "kyc.approve" as AdminPermission, "kyc.reject" as AdminPermission],
        campaign_manager: ["dashboard.read", "campaigns.read", "campaigns.write", "campaigns.moderate"],
        moderator: ["dashboard.read", "users.read", "creators.read", "brands.read", "moderation.read", "moderation.write"],
        support: ["dashboard.read", "support.read", "support.write", "disputes.read", "disputes.write"],
        finance: ["dashboard.read", "payments.read", "payments.write", "escrow.read", "escrow.write", "refunds.read", "refunds.write"],
      };

      const userPermissions = permissionsMap[roleStr] || [];
      return userPermissions.includes(permission);
    },
    [admin]
  );

  const value: AdminAuthContextValue = {
    admin,
    session,
    status,
    loading,
    hasPermission,
    refreshAdmin: (force?: boolean) => refreshAdmin(undefined, undefined, force !== false),
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  }
  return ctx;
}

export function useHasPermission(permission: AdminPermission): boolean {
  const { hasPermission } = useAdminAuth();
  return hasPermission(permission);
}

export function useAdminAuthOptional(): AdminAuthContextValue | null {
  return useContext(AdminAuthContext);
}
