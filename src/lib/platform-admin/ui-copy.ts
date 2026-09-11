import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import {
  setMessageAtPath,
  type MessagesTree,
  type UiCopyLocale,
} from "@/lib/platform-admin/ui-copy-shared";

export type { MessagesTree, UiCopyLocale } from "@/lib/platform-admin/ui-copy-shared";
export {
  deepMergeMessages,
  findMessageKeysForText,
  flattenMessages,
  setMessageAtPath,
} from "@/lib/platform-admin/ui-copy-shared";

export async function listUiCopyOverridesForLocale(
  locale: UiCopyLocale,
): Promise<Record<string, string>> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("platform_ui_copy_overrides")
      .select("message_key, value")
      .eq("locale", locale);

    if (error) {
      console.error("[ui-copy] list failed", error);
      return {};
    }

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      map[row.message_key] = row.value;
    }
    return map;
  } catch (error) {
    console.error("[ui-copy] list unavailable", error);
    return {};
  }
}

export async function applyUiCopyOverrides(
  locale: string,
  messages: MessagesTree,
): Promise<MessagesTree> {
  if (locale !== "es-CO" && locale !== "en-US") return messages;
  const overrides = await listUiCopyOverridesForLocale(locale);
  let merged = messages;
  for (const [path, value] of Object.entries(overrides)) {
    merged = setMessageAtPath(merged, path, value);
  }
  return merged;
}

export async function upsertUiCopyOverride(input: {
  locale: UiCopyLocale;
  messageKey: string;
  value: string;
}): Promise<void> {
  const userId = await requirePlatformAdmin();
  const messageKey = input.messageKey.trim();
  if (!messageKey || messageKey.includes(" ")) {
    throw new Error("invalid_message_key");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("platform_ui_copy_overrides").upsert(
    {
      locale: input.locale,
      message_key: messageKey,
      value: input.value,
      updated_by_sub: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "locale,message_key" },
  );

  if (error) throw error;

  await writeAuditLog({
    action: "platform.ui_copy.upsert",
    actorSub: userId,
    resourceType: "platform_ui_copy_overrides",
    resourceId: `${input.locale}:${messageKey}`,
    metadata: { locale: input.locale, messageKey, valueLength: input.value.length },
  });
}

export async function deleteUiCopyOverride(input: {
  locale: UiCopyLocale;
  messageKey: string;
}): Promise<void> {
  const userId = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("platform_ui_copy_overrides")
    .delete()
    .eq("locale", input.locale)
    .eq("message_key", input.messageKey);

  if (error) throw error;

  await writeAuditLog({
    action: "platform.ui_copy.delete",
    actorSub: userId,
    resourceType: "platform_ui_copy_overrides",
    resourceId: `${input.locale}:${input.messageKey}`,
    metadata: { locale: input.locale, messageKey: input.messageKey },
  });
}

const LIVE_EDITOR_FAB_KEY = "live_editor_fab";

export async function getLiveEditorFabVisible(): Promise<boolean> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("platform_admin_settings")
      .select("value")
      .eq("key", LIVE_EDITOR_FAB_KEY)
      .maybeSingle();

    if (error || !data) return true;
    const value = data.value as { visible?: boolean } | null;
    return value?.visible !== false;
  } catch {
    return true;
  }
}

export async function setLiveEditorFabVisible(visible: boolean): Promise<void> {
  const userId = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("platform_admin_settings").upsert({
    key: LIVE_EDITOR_FAB_KEY,
    value: { visible },
    updated_by_sub: userId,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  await writeAuditLog({
    action: "platform.live_editor_fab.set",
    actorSub: userId,
    resourceType: "platform_admin_settings",
    resourceId: LIVE_EDITOR_FAB_KEY,
    metadata: { visible },
  });
}
