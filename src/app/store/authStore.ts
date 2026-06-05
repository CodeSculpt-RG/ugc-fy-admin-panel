import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminPermission, AdminRole } from "@/lib/api/adminPermissions";

export interface AuthAdminUser {
  id: string;
  email: string;
  role: AdminRole;
  name: string;
  permissions: AdminPermission[];
  isActive: boolean;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: AuthAdminUser | null;
  token: string | null;
  setAuth: (user: AuthAdminUser, token: string) => void;
  logout: () => void;
  /** Check if the currently stored user has a permission (client-side UX only) */
  hasPermission: (permission: AdminPermission) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        if (typeof window !== "undefined") {
          // Clear all cookies
          try {
            document.cookie.split(";").forEach((c) => {
              document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
          } catch (e) {
            console.error("Failed to clear cookies:", e);
          }
          // Clear all local storage
          try {
            localStorage.clear();
          } catch (e) {
            console.error("Failed to clear localStorage:", e);
          }
          // Redirect to login if not already on public/login pages to prevent loops
          const path = window.location.pathname.replace(/\/$/, "");
          if (path !== "/admin/login" && path !== "/admin/setup-password") {
            window.location.href = "/admin/login";
          }
        }
        set({ user: null, token: null });
      },
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: "admin-auth-storage",
    }
  )
);
