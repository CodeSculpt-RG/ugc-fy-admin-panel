import { adminFetch } from "@/app/services/adminApiClient";
import type { AdminPermission } from "@/lib/api/adminPermissions";

export const NOTIFICATION_CATEGORY_PERMISSIONS: Record<string, AdminPermission[]> = {
  system: ["settings.read", "admin_management.read", "dashboard.read"], // Dashboard baseline
  security: ["audit.read", "settings.read"],
  approval: ["kyc.read", "users.manage", "users.approve"],
  payment: ["finance.read"],
  report: ["moderation.read"],
  dispute: ["support.read"],
  moderation: ["moderation.read"],
};

export function getAllowedNotificationCategories(
  checkPermission: (permission: AdminPermission) => boolean
): string[] {
  const allowed: string[] = [];
  for (const [category, perms] of Object.entries(NOTIFICATION_CATEGORY_PERMISSIONS)) {
    if (perms.some((p) => checkPermission(p))) {
      allowed.push(category);
    }
  }
  return allowed;
}

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

export type NotificationServiceResult =
  | {
      ok: true;
      data: AdminNotification[];
      unreadCount: number;
    }
  | {
      ok: false;
      status: number;
      code: "UNAUTHORIZED" | "FORBIDDEN" | "NETWORK_ERROR" | "UNKNOWN";
      message: string;
    };

export const notificationService = {
  getNotifications: async (categories?: string[], signal?: AbortSignal): Promise<NotificationServiceResult> => {
    let url = "/api/admin/notifications";
    if (categories && categories.length > 0) {
      url += `?categories=${encodeURIComponent(categories.join(","))}`;
    }
    const response = await adminFetch(url, {
      method: "GET",
      signal,
    });

    const payload = (await response
      .json()
      .catch((): null => null)) as {
      success?: boolean;
      data?: AdminNotification[];
      unreadCount?: number;
      error?: { message?: string; details?: string | null };
    } | null;

    if (response.status === 401) {
      return {
        ok: false,
        status: 401,
        code: "UNAUTHORIZED",
        message: "Your session has expired.",
      };
    }

    if (response.status === 403) {
      return {
        ok: false,
        status: 403,
        code: "FORBIDDEN",
        message: "You do not have access to these notifications.",
      };
    }

    if (!response.ok || !payload?.success) {
      const msg =
        payload?.error?.message ||
        payload?.error?.details ||
        `Failed to fetch notifications. HTTP ${response.status}`;

      return {
        ok: false,
        status: response.status,
        code: "UNKNOWN",
        message: msg,
      };
    }

    return {
      ok: true,
      data: payload.data || [],
      unreadCount: payload.unreadCount || 0,
    };
  },

  markAsRead: async (id: string): Promise<{ ok: boolean; data?: AdminNotification; message?: string }> => {
    const response = await adminFetch(`/api/admin/notifications/${id}/read`, {
      method: "PATCH",
      body: JSON.stringify({ is_read: true }),
      dedupe: false,
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

      if (process.env.NODE_ENV === "development") {
        console.warn("[Notifications] Mark as read failed:", msg);
      }
      return { ok: false, message: msg };
    }

    return {
      ok: true,
      data: payload.data,
    };
  },
};
