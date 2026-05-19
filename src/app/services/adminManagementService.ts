import { supabase } from "@/lib/supabase/client";
import { AdminUser } from "@/app/types";

export const adminManagementService = {
  getAdmins: async (): Promise<AdminUser[]> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/admins", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Failed to fetch administrators.");
    }

    return payload.data || [];
  },
  createAdmin: async (payload: { email: string; full_name: string; role: string; is_active: boolean }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/admins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error || resData.error?.message || "Failed to provision administrator.");
    }

    return resData;
  },
};
