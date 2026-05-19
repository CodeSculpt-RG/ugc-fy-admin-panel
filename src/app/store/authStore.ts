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
      logout: () => set({ user: null, token: null }),
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
