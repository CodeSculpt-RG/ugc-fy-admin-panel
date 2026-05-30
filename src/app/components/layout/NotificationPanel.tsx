"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Info,
  AlertTriangle,
  CreditCard,
  Shield,
  FileText,
  UserCheck,
  Lock,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { notificationService, AdminNotification } from "@/app/services/notificationService";
import { useToast } from "@/app/hooks/useToast";

export function NotificationPanel({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load notifications.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string, href?: string | null) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (href) {
        onClose?.();
        router.push(href);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update notification.";
      showToast(msg, "error");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CreditCard className="w-4 h-4 text-primary" />;
      case "moderation":
        return <Shield className="w-4 h-4 text-error" />;
      case "dispute":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "approval":
        return <UserCheck className="w-4 h-4 text-success-green" />;
      case "security":
        return <Lock className="w-4 h-4 text-accent-orange" />;
      case "report":
        return <FileText className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-foreground/60" />;
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-surface border border-border p-5 rounded-[36px] shadow-2xl overflow-hidden relative flex flex-col max-h-[540px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Intel Feed</h3>
            <p className="text-[10px] text-foreground/40 font-medium">Real-time administrative alerts</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest shadow-sm shadow-primary/10">
            {unreadCount} Unread
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
        {loading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-foreground/40">
              Synchronizing Feed...
            </span>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-4">
            <p className="text-xs font-semibold text-error px-4">{error}</p>
            <button
              onClick={loadNotifications}
              className="px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-widest text-white border border-border transition-all"
            >
              Retry Sync
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Info className="w-8 h-8 text-foreground/20 mx-auto" />
            <p className="text-xs font-black uppercase tracking-widest text-foreground/40">No notifications yet</p>
            <p className="text-[10px] font-medium text-foreground/20">Your system operations feed is currently nominal.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id, notification.href)}
              className={cn(
                "p-4 rounded-[24px] border transition-all duration-300 cursor-pointer flex items-start space-x-4 group",
                !notification.is_read
                  ? "bg-primary/5 border-primary/20 text-white shadow-sm shadow-primary/5 hover:bg-primary/10 hover:border-primary/30"
                  : "bg-surface-elevated border-border text-foreground/40 hover:bg-surface-elevated hover:bg-foreground/5 hover:border-border"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl border flex-shrink-0 transition-transform duration-500 group-hover:scale-110 flex items-center justify-center",
                  !notification.is_read
                    ? "bg-primary/10 border-primary/20"
                    : "bg-surface-elevated border-border"
                )}
              >
                {!notification.is_read ? getIcon(notification.type) : <Check className="w-4 h-4 text-foreground/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                    {notification.type}
                  </span>
                  <span className="text-[9px] font-semibold text-foreground/30">
                    {new Date(notification.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className={cn("text-xs font-black tracking-tight leading-snug truncate", !notification.is_read && "text-white")}>
                  {notification.title}
                </p>
                <p className="text-[11px] text-foreground/60 mt-1 leading-relaxed line-clamp-2 font-medium">
                  {notification.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <button
          onClick={() => loadNotifications()}
          className="flex items-center space-x-2 text-[10px] font-black text-foreground/40 hover:text-white uppercase tracking-widest transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh Feed</span>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 text-[10px] font-black text-foreground/40 hover:text-white uppercase tracking-widest transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        )}
      </div>
    </div>
  );
}
