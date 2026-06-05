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
import type { AdminPermission, AdminRole } from "@/lib/api/adminPermissions";
import type { AuthAdminUser } from "@/app/store/authStore";
import { useAuthStore } from "@/app/store/authStore";
import {
  onAdminSessionExpired,
  resetAdminSessionExpiredNotice,
} from "@/app/services/adminApiClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminAuthContextValue {
  admin: AuthAdminUser | null;
  session: { access_token: string } | null;
  loading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  refreshAdmin: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setAuth, logout } = useAuthStore();
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialization lock to prevent duplicate API requests
  const activeTokenRef = useRef<string | null>(null);

  const refreshAdmin = useCallback(async (
    currentSession?: { access_token: string } | null,
    signal?: AbortSignal
  ) => {
    try {
      const activeSession = currentSession !== undefined ? currentSession : (await supabase.auth.getSession()).data.session;
      if (!activeSession?.access_token) {
        setLoading(false);
        activeTokenRef.current = null;
        return;
      }

      // Lock check: prevent fetching again if we already have the state for this token
      if (activeTokenRef.current === activeSession.access_token) {
        setLoading(false);
        return;
      }
      activeTokenRef.current = activeSession.access_token;

      const response = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${activeSession.access_token}` },
        signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
        }
        setLoading(false);
        return;
      }

      const payload = await response.json();
      if (payload.success && payload.data) {
        const freshAdmin: AuthAdminUser = {
          id: payload.data.id,
          email: payload.data.email,
          role: payload.data.role as AdminRole,
          name: payload.data.fullName || payload.data.email,
          permissions: payload.data.permissions as AdminPermission[],
          isActive: payload.data.isActive,
          mustChangePassword: payload.data.mustChangePassword,
        };
        setAuth(freshAdmin, activeSession.access_token);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[AdminAuthContext] refreshAdmin failed:", err);
    } finally {
      setLoading(false);
    }
  }, [setAuth, logout]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const stopSessionExpiredListener = onAdminSessionExpired(() => {
      if (!mounted) return;
      setSession(null);
      logout();
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("[AdminAuth] getSession failed:", {
          message: error.message,
        });
      }

      setSession(data.session ?? null);
      if (data.session?.access_token) {
        refreshAdmin(data.session, controller.signal).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      if (nextSession?.access_token) {
        resetAdminSessionExpiredNotice();
        refreshAdmin(nextSession, controller.signal);
      } else {
        logout();
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      controller.abort(new DOMException("Admin auth request cancelled", "AbortError"));
      stopSessionExpiredListener();
      subscription.unsubscribe();
    };
  }, [refreshAdmin, logout]);

  const hasPermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (!user || !user.permissions) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const value: AdminAuthContextValue = {
    admin: user,
    session,
    loading,
    hasPermission,
    refreshAdmin: () => refreshAdmin(),
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

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
