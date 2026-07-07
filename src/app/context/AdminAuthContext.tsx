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
import { hasPermission as checkPermission } from "@/lib/api/adminPermissions";
import type { AdminUser } from "@/lib/auth/admin-types";
import { useAuthStore } from "@/app/store/authStore";
import type { Session } from "@supabase/supabase-js";

export type AdminAuthStatus =
  | "initializing"
  | "authenticated"
  | "unauthenticated"
  | "unauthorized"
  | "error";

interface AdminAuthContextValue {
  admin: AdminUser | null;
  session: Session | null;
  status: AdminAuthStatus;
  loading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  refreshAdmin: (force?: boolean) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function getSessionToken(session: Session | null): string | null {
  return session?.access_token ?? null;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout } = useAuthStore();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AdminAuthStatus>("initializing");
  
  const loading = status === "initializing";

  const mountedRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const activeTokenRef = useRef<string | null>(null);

  const safeSetStatus = useCallback((nextStatus: AdminAuthStatus) => {
    if (mountedRef.current) {
      setStatus(nextStatus);
    }
  }, []);

  const safeSetAdmin = useCallback((nextAdmin: AdminUser | null) => {
    if (mountedRef.current) {
      setAdmin(nextAdmin);
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      deleteCookie("admin-token");
    }
    safeSetAdmin(null);
    setSession(null);
    safeSetStatus("unauthenticated");
    logout();
    activeTokenRef.current = null;
  }, [logout, safeSetAdmin, safeSetStatus]);

  const refreshAdmin = useCallback(async (options?: { signal?: AbortSignal; force?: boolean }) => {
    if (refreshInFlightRef.current && !options?.force) {
      return;
    }

    refreshInFlightRef.current = true;
    if (status !== "authenticated" && status !== "initializing") {
      safeSetStatus("initializing");
    }

    try {
      const { data } = await supabase.auth.getSession();
      const activeSession = data.session;

      if (!activeSession?.access_token) {
        handleLogout();
        return;
      }

      if (typeof window !== "undefined") {
        setCookie("admin-token", activeSession.access_token, { maxAge: 60 * 60 * 12, path: "/" });
      }

      if (!options?.force && activeTokenRef.current === activeSession.access_token) {
        // We already successfully fetched for this token
        if (admin) {
          safeSetStatus("authenticated");
        } else {
          // If we have token but no admin, we shouldn't short-circuit
          if (status === "initializing") {
            // Force fetch
          } else {
            safeSetStatus("authenticated");
            return;
          }
        }
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);
      const signal = options?.signal || controller.signal;

      let response: Response;
      try {
        response = await fetch("/api/admin/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { 
            Accept: "application/json",
            Authorization: `Bearer ${activeSession.access_token}`
          },
          signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (response.status === 401) {
        safeSetAdmin(null);
        safeSetStatus("unauthenticated");
        handleLogout();
        await supabase.auth.signOut();
        return;
      }

      if (response.status === 403) {
        safeSetAdmin(null);
        safeSetStatus("unauthorized");
        handleLogout();
        await supabase.auth.signOut();
        return;
      }

      if (!response.ok) {
        safeSetAdmin(null);
        safeSetStatus("error");
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!payload?.success && !payload?.ok) {
        safeSetAdmin(null);
        safeSetStatus("unauthorized");
        return;
      }

      const verifiedAdmin = payload.admin ?? payload.data?.admin ?? null;
      if (!verifiedAdmin) {
        safeSetAdmin(null);
        safeSetStatus("unauthorized");
        return;
      }

      activeTokenRef.current = activeSession.access_token;
      safeSetAdmin(verifiedAdmin);
      safeSetStatus("authenticated");

      const storeAdmin = {
        id: verifiedAdmin.id,
        email: verifiedAdmin.email,
        role: verifiedAdmin.role.toUpperCase(),
        name: verifiedAdmin.full_name || verifiedAdmin.email.split("@")[0],
        full_name: verifiedAdmin.full_name,
        permissions: verifiedAdmin.permissions || [],
        isActive: verifiedAdmin.status === "active",
      };
      
      type AuthStoreParam = Parameters<typeof setAuth>[0];
      setAuth(storeAdmin as unknown as AuthStoreParam, activeSession.access_token);

    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("[AdminAuthContext] Admin refresh failed:", error);
      safeSetAdmin(null);
      safeSetStatus("error");
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [admin, handleLogout, safeSetAdmin, safeSetStatus, setAuth, status]);

  const refreshAdminRef = useRef(refreshAdmin);
  useEffect(() => {
    refreshAdminRef.current = refreshAdmin;
  }, [refreshAdmin]);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    void refreshAdminRef.current({ signal: controller.signal });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;

      setSession((currentSession) => {
        const currentToken = getSessionToken(currentSession);
        const nextToken = getSessionToken(nextSession);
        if (currentToken === nextToken) {
          return currentSession;
        }
        return nextSession;
      });

      if (event === "SIGNED_OUT") {
        safeSetAdmin(null);
        safeSetStatus("unauthenticated");
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        void refreshAdminRef.current({ force: true });
      }
    });

    return () => {
      mountedRef.current = false;
      controller.abort();
      subscription.unsubscribe();
    };
  }, [safeSetAdmin, safeSetStatus]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!admin) return false;
      const roleStr = admin.role.toLowerCase();
      if (roleStr === "owner" || roleStr === "super_admin") return true;
      
      return checkPermission((admin.permissions as AdminPermission[]) || [], permission);
    },
    [admin]
  );

  const value: AdminAuthContextValue = {
    admin,
    session,
    status,
    loading,
    hasPermission,
    refreshAdmin: (force?: boolean) => refreshAdminRef.current({ force }),
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
