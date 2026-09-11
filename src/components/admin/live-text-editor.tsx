"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EyeOff, Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useLiveEditor } from "@/components/admin/live-editor-provider";
import { Button } from "@/components/ui/button";
import {
  resetUiCopyOverrideAction,
  saveUiCopyOverrideAction,
  setLiveEditorFabVisibleAction,
} from "@/lib/platform-admin/ui-copy-actions";
import { findMessageKeysForText, type UiCopyLocale } from "@/lib/platform-admin/ui-copy-shared";
import { cn } from "@/lib/utils";

type Draft = {
  keys: string[];
  selectedKey: string;
  value: string;
  x: number;
  y: number;
};

function nearestEditableText(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  let el: Element | null = target;
  while (el && el !== document.body) {
    if (el.closest("[data-live-editor-ui]")) return null;
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "textarea", "input", "select", "option"].includes(tag)) {
      return null;
    }
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text && text.length <= 500 && el.childElementCount <= 4) {
      if (el.childElementCount === 0 || text.length < 180) return text;
    }
    el = el.parentElement;
  }
  return null;
}

export function LiveTextEditor({ fabVisible }: { fabVisible: boolean }) {
  const t = useTranslations("admin.liveEditor");
  const locale = useLocale() as UiCopyLocale;
  const router = useRouter();
  const { editing, setEditing, flatMessages, applyLocalOverride } = useLiveEditor();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [fabHiddenLocally, setFabHiddenLocally] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const showFab = fabVisible && !fabHiddenLocally;

  useEffect(() => {
    if (!editing) {
      document.body.classList.remove("live-editor-active");
      return;
    }
    document.body.classList.add("live-editor-active");

    function onClick(event: MouseEvent) {
      if (panelRef.current?.contains(event.target as Node)) return;
      const text = nearestEditableText(event.target);
      if (!text) return;
      event.preventDefault();
      event.stopPropagation();

      const keys = findMessageKeysForText(flatMessages, text);
      if (keys.length === 0) {
        setError(t("noMatch"));
        setDraft(null);
        return;
      }
      setError(null);
      setDraft({
        keys,
        selectedKey: keys[0]!,
        value: flatMessages[keys[0]!] ?? text,
        x: Math.min(event.clientX, window.innerWidth - 360),
        y: Math.min(event.clientY + 12, window.innerHeight - 280),
      });
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.body.classList.remove("live-editor-active");
    };
  }, [editing, flatMessages, t]);

  useEffect(() => {
    if (!bannerOpen) return;
    const timer = window.setTimeout(() => setBannerOpen(false), 5000);
    return () => window.clearTimeout(timer);
  }, [bannerOpen]);

  const keyOptions = useMemo(() => draft?.keys ?? [], [draft]);

  function toggleEditing() {
    const next = !editing;
    setEditing(next);
    setDraft(null);
    setError(null);
    setBannerOpen(next);
  }

  function save() {
    if (!draft) return;
    const messageKey = draft.selectedKey;
    const value = draft.value;
    setError(null);
    applyLocalOverride(messageKey, value);
    startTransition(async () => {
      const result = await saveUiCopyOverrideAction({ locale, messageKey, value });
      if (!result.ok) {
        setError(t("saveFailed"));
        return;
      }
      setDraft(null);
    });
  }

  function reset() {
    if (!draft) return;
    const messageKey = draft.selectedKey;
    setError(null);
    startTransition(async () => {
      const result = await resetUiCopyOverrideAction({ locale, messageKey });
      if (!result.ok) {
        setError(t("resetFailed"));
        return;
      }
      window.location.reload();
    });
  }

  function hideFab() {
    startTransition(async () => {
      const result = await setLiveEditorFabVisibleAction(false);
      if (!result.ok) {
        setError(t("hideFailed"));
        return;
      }
      setFabHiddenLocally(true);
      setEditing(false);
      setDraft(null);
      setBannerOpen(false);
      router.refresh();
    });
  }

  if (!showFab && !editing) return null;

  return (
    <div data-live-editor-ui className="pointer-events-none fixed inset-0 z-[100]">
      {bannerOpen ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
          <div className="pointer-events-auto rounded-full border border-primary/30 bg-card px-4 py-2 text-sm shadow-lg">
            {t("editingBanner")}
          </div>
        </div>
      ) : null}

      {draft ? (
        <div
          ref={panelRef}
          className="pointer-events-auto absolute w-[340px] rounded-2xl border border-border bg-card p-4 shadow-xl"
          style={{ left: Math.max(12, draft.x), top: Math.max(12, draft.y) }}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{t("editTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("editHint")}</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setDraft(null)}
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {keyOptions.length > 1 ? (
            <label className="mb-2 block space-y-1 text-xs">
              <span className="text-muted-foreground">{t("keyLabel")}</span>
              <select
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                value={draft.selectedKey}
                onChange={(e) => {
                  const selectedKey = e.target.value;
                  setDraft({
                    ...draft,
                    selectedKey,
                    value: flatMessages[selectedKey] ?? draft.value,
                  });
                }}
              >
                {keyOptions.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mb-2 break-all font-mono text-[11px] text-muted-foreground">
              {draft.selectedKey}
            </p>
          )}

          <textarea
            className="min-h-[110px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          />

          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={pending} onClick={save}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("save")}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={reset}>
              {t("reset")}
            </Button>
          </div>
        </div>
      ) : null}

      {error && !draft ? (
        <div className="pointer-events-auto absolute bottom-24 right-5 max-w-xs rounded-xl border border-destructive/30 bg-card px-3 py-2 text-xs text-destructive shadow-lg">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            {t("close")}
          </button>
        </div>
      ) : null}

      {showFab ? (
        <div className="pointer-events-auto absolute bottom-5 right-5 flex flex-col items-end gap-2">
          {editing ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shadow-lg"
              disabled={pending}
              onClick={hideFab}
            >
              <EyeOff className="h-4 w-4" />
              {t("hideFab")}
            </Button>
          ) : null}
          <button
            type="button"
            aria-label={editing ? t("exitEdit") : t("enterEdit")}
            title={editing ? t("exitEdit") : t("enterEdit")}
            onClick={toggleEditing}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition",
              editing
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            {editing ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
          </button>
        </div>
      ) : null}
    </div>
  );
}
