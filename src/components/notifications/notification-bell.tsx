"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, CheckCheck } from "lucide-react";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import type { NotificationRecord } from "@/lib/notifications/service";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  async function refresh() {
    const data = await getNotificationsAction();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) void refresh();
  }

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      await refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      await refresh();
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="relative rounded-lg" aria-label={t("title")}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>{t("title")}</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline"
              onClick={markAllRead}
              disabled={pending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("markAllRead")}
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex cursor-pointer flex-col items-start gap-1 whitespace-normal py-3"
              onClick={() => {
                if (!notification.readAt) markRead(notification.id);
              }}
            >
              <span className={`text-sm ${notification.readAt ? "text-muted-foreground" : "font-medium"}`}>
                {notification.title}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{notification.body}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
