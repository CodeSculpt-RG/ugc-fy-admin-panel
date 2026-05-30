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

export default function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const checkUnread = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications();
      setUnreadCount(res.unreadCount);
    } catch (e) {
      console.error("[NotificationDropdown] Failed unread check", e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    void checkUnread();
  }, [checkUnread]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          onClick={() => {
            if (!isOpen) checkUnread();
          }}
          className="relative p-3.5 rounded-2xl bg-surface-elevated border border-border text-foreground/30 hover:text-foreground hover:bg-white/[0.06] hover:border-border transition-all group outline-none active:scale-90"
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
