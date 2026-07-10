import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type NotificationRecord = {
  id: string;
  tenantId: string | null;
  recipientSub: string;
  channel: "in_app" | "email";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

function mapNotification(row: {
  id: string;
  tenant_id: string | null;
  recipient_sub: string;
  channel: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}): NotificationRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    recipientSub: row.recipient_sub,
    channel: row.channel as NotificationRecord["channel"],
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function createNotification(input: {
  recipientSub: string;
  title: string;
  body: string;
  tenantId?: string | null;
  channel?: NotificationRecord["channel"];
}): Promise<NotificationRecord> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_sub: input.recipientSub,
      title: input.title,
      body: input.body,
      tenant_id: input.tenantId ?? null,
      channel: input.channel ?? "in_app",
    })
    .select("id, tenant_id, recipient_sub, channel, title, body, read_at, created_at")
    .single();

  if (error) throw error;
  return mapNotification(data);
}

export async function listNotificationsForUser(
  recipientSub: string,
  limit = 20,
): Promise<NotificationRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, tenant_id, recipient_sub, channel, title, body, read_at, created_at")
    .eq("recipient_sub", recipientSub)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapNotification);
}

export async function getUnreadNotificationCount(recipientSub: string): Promise<number> {
  const supabase = createServiceRoleSupabaseClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_sub", recipientSub)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(
  notificationId: string,
  recipientSub: string,
): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_sub", recipientSub)
    .is("read_at", null);

  if (error) throw error;
}

export async function markAllNotificationsRead(recipientSub: string): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_sub", recipientSub)
    .is("read_at", null);

  if (error) throw error;
}
