import { supabase } from "@/lib/supabase/client";

export type AdminNotification = {
  id: string;
  admin_id: string | null;
  type: "system" | "approval" | "payment" | "security" | "report" | "dispute" | "moderation";
  title: string;
  message: string;
  href?: string | null;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
};

export type NotificationsResponse = {
  success: boolean;
  data: AdminNotification[];
  unreadCount: number;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Auth error: ${error.message}`);
  }

  if (!session?.access_token) {
    throw new Error("Administrative session required.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    const response = await fetch("/api/admin/notifications", {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      data?: AdminNotification[];
      unreadCount?: number;
      error?: { message?: string; details?: string | null };
    } | null;

    if (!response.ok || !payload?.success) {
      const msg =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to fetch notifications. HTTP ${response.status}`;

      throw new Error(msg);
    }

    return {
      success: true,
      data: payload.data || [],
      unreadCount: payload.unreadCount || 0,
    };
  },

  markAsRead: async (id: string): Promise<{ success: boolean; data?: AdminNotification }> => {
    const response = await fetch(`/api/admin/notifications/${id}/read`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ is_read: true }),
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      data?: AdminNotification;
      error?: { message?: string; details?: string | null };
    } | null;

    if (!response.ok || !payload?.success) {
      const msg =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to mark notification as read. HTTP ${response.status}`;

      throw new Error(msg);
    }

    return {
      success: true,
      data: payload.data,
    };
  },
};
