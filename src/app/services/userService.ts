import { supabase } from "@/lib/supabase/client";
import { User, UserStatus, RiskLevel } from "@/app/types";

type UserInternal = {
  id: string;
  email: string;
  role: "creator" | "brand" | "admin";
  full_name: string | null;
  approval_status: "pending_review" | "approved" | "rejected" | "blocked";
  profile_completed: boolean | null;
  updated_at: string;
};

type UserApiResponse = {
  success: boolean;
  source: string;
  data?: UserInternal[];
  error?: {
    message: string;
    code: string;
  };
};

const mapInternalToUser = (internal: UserInternal): User => ({
  id: internal.id,
  name: internal.full_name || "Anonymous Entity",
  email: internal.email,
  role: (internal.role.charAt(0).toUpperCase() + internal.role.slice(1)) as "Creator" | "Brand" | "Admin",
  status: (internal.approval_status === "approved" ? "Active" : internal.approval_status === "pending_review" ? "Pending" : "Restricted") as UserStatus,
  verification: internal.profile_completed ? "Verified" : "Unverified",
  lastActive: internal.updated_at,
  riskLevel: "Low" as RiskLevel,
});

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Administrative session expired. Please login again.");

    const response = await fetch("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = await response.json() as UserApiResponse;
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Infrastructure failure while fetching users.");
    }

    return (payload.data ?? []).map(mapInternalToUser);
  },

  getPendingUsers: async (): Promise<User[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Administrative session expired.");

    const response = await fetch("/api/admin/users/pending", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = await response.json() as UserApiResponse;
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Infrastructure failure while fetching pending users.");
    }

    return (payload.data ?? []).map(mapInternalToUser);
  }
};
