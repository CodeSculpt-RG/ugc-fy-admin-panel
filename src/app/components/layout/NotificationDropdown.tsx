"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { NotificationPanel } from "./NotificationPanel";
import { notificationService, getAllowedNotificationCategories } from "@/app/services/notificationService";
import { useAdminAuthOptional } from "@/app/context/AdminAuthContext";
import { isAdminSessionExpiredError } from "@/app/services/adminApiClient";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

export default function NotificationDropdown() {
  const auth = useAdminAuthOptional();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const checkUnread = useCallback(async (signal?: AbortSignal) => {
    if (!auth?.session?.access_token || !auth.hasPermission) {
      setUnreadCount(0);
      return;
    }

    const categories = getAllowedNotificationCategories(auth.hasPermission);
    if (categories.length === 0) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await notificationService.getNotifications(categories, signal);
      if (res.ok) {
        setUnreadCount(res.unreadCount);
      } else if (res.status === 403) {
        if (process.env.NODE_ENV === "development") {
          console.debug("[Notifications] Skipped unauthorized notification source");
        }
        setUnreadCount(0);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (isAdminSessionExpiredError(e)) return;
      if (process.env.NODE_ENV === "development") {
        console.warn("[NotificationDropdown] Failed unread check", e);
      }
    }
  }, [auth]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void checkUnread(controller.signal);
      }
    });
    return () => controller.abort(new DOMException("Notification count request cancelled", "AbortError"));
  }, [checkUnread]);

  const handleNotificationPayload = useCallback(() => {
    if (auth?.session?.access_token) {
      console.log('[Realtime] New notification count update');
      void checkUnread();
    }
  }, [auth?.session?.access_token, checkUnread]);

  useSupabaseRealtime({
    channelName: 'notifications_dropdown',
    table: 'notifications',
    event: '*',
    enabled: Boolean(auth?.session?.access_token),
    onPayload: handleNotificationPayload,
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => {
            if (!isOpen) void checkUnread();
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-[24px] border border-white/70 bg-white/85 backdrop-blur-2xl text-neutral-600 shadow-sm transition-all hover:bg-white hover:text-neutral-950 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)] group outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-500/30"
        >
          <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="p-0 bg-transparent border-none shadow-none"
        sideOffset={16}
      >
        <NotificationPanel
          onClose={() => {
            setIsOpen(false);
            void checkUnread();
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
