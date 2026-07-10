"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getUnreadNotificationCount,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/service";

export async function getNotificationsAction() {
  const { userId } = await auth();
  if (!userId) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(userId),
    getUnreadNotificationCount(userId),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ ok: true } | { ok: false }> {
  const { userId } = await auth();
  if (!userId) return { ok: false };

  await markNotificationRead(notificationId, userId);
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: true } | { ok: false }> {
  const { userId } = await auth();
  if (!userId) return { ok: false };

  await markAllNotificationsRead(userId);
  return { ok: true };
}
