"use server";

import { revalidatePath } from "next/cache";
import {
  deleteUiCopyOverride,
  getLiveEditorFabVisible,
  setLiveEditorFabVisible,
  upsertUiCopyOverride,
  type UiCopyLocale,
} from "@/lib/platform-admin/ui-copy";
import { requirePlatformAdmin } from "@/lib/platform-admin/auth";

export async function saveUiCopyOverrideAction(input: {
  locale: UiCopyLocale;
  messageKey: string;
  value: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await upsertUiCopyOverride(input);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[ui-copy] save failed", error);
    return { ok: false, error: "save_failed" };
  }
}

export async function resetUiCopyOverrideAction(input: {
  locale: UiCopyLocale;
  messageKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deleteUiCopyOverride(input);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[ui-copy] reset failed", error);
    return { ok: false, error: "reset_failed" };
  }
}

export async function setLiveEditorFabVisibleAction(
  visible: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await setLiveEditorFabVisible(visible);
    revalidatePath("/", "layout");
    revalidatePath("/admin/flags");
    return { ok: true };
  } catch (error) {
    console.error("[ui-copy] fab setting failed", error);
    return { ok: false, error: "save_failed" };
  }
}

export async function getLiveEditorFabVisibleAction(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return await getLiveEditorFabVisible();
  } catch {
    return true;
  }
}
