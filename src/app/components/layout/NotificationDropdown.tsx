"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { NotificationPanel } from "./NotificationPanel";
import { notificationService } from "@/app/services/notificationService";
import { useAdminAuthOptional } from "@/app/context/AdminAuthContext";
import { isAdminSessionExpiredError } from "@/app/services/adminApiClient";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

export default function NotificationDropdown() {
  const auth = useAdminAuthOptional();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const checkUnread = useCallback(async (signal?: AbortSignal) => {
    if (!auth?.session?.access_token) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await notificationService.getNotifications(signal);
      setUnreadCount(res.unreadCount);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (isAdminSessionExpiredError(e)) return;
      console.error("[NotificationDropdown] Failed unread check", e);
    }
  }, [auth?.session?.access_token]);

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
          className="relative p-3.5 rounded-2xl bg-surface-elevated border border-border text-foreground/30 hover:text-foreground hover:bg-foreground/[0.06] hover:border-border transition-all group outline-none active:scale-90"
        >
          <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent-orange rounded-full border-2 border-card-bg animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
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
