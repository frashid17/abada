"use client";

import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const AVATAR_TONES = [
  "bg-[hsl(210_70%_42%)]",
  "bg-[hsl(25_45%_40%)]",
  "bg-[hsl(160_40%_32%)]",
  "bg-[hsl(340_45%_42%)]",
  "bg-[hsl(270_35%_42%)]",
  "bg-[hsl(40_55%_40%)]",
] as const;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function avatarTone(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = (hash + email.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0]!;
}

function initialFor(email: string): string {
  const local = email.split("@")[0] ?? email;
  return (local[0] ?? "?").toUpperCase();
}

type EmailChipInputProps = {
  id?: string;
  value: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function EmailChipInput({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: EmailChipInputProps) {
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addEmails(candidates: string[]) {
    const next = [...value];
    let added = false;
    let sawInvalid = false;

    for (const candidate of candidates) {
      const email = normalizeEmail(candidate);
      if (!email) continue;
      if (!isValidEmail(email)) {
        sawInvalid = true;
        continue;
      }
      if (next.includes(email)) continue;
      next.push(email);
      added = true;
    }

    if (added) onChange(next);
    setInvalid(sawInvalid && !added);
    return added || (!sawInvalid && candidates.every((c) => !normalizeEmail(c)));
  }

  function commitDraft() {
    const parts = parseEmails(draft);
    if (parts.length === 0) {
      setDraft("");
      setInvalid(false);
      return;
    }
    const ok = addEmails(parts);
    if (ok) {
      setDraft("");
      setInvalid(false);
    }
  }

  function removeEmail(email: string) {
    onChange(value.filter((item) => item !== email));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === ";" || event.key === "Tab") {
      if (draft.trim()) {
        event.preventDefault();
        commitDraft();
      }
      return;
    }

    if (event.key === "Backspace" && !draft && value.length > 0) {
      event.preventDefault();
      removeEmail(value[value.length - 1]!);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (!/[,;\s]/.test(text)) return;
    event.preventDefault();
    addEmails(parseEmails(`${draft} ${text}`));
    setDraft("");
    setInvalid(false);
  }

  return (
    <div
      className={cn(
        "flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2",
        invalid && "border-destructive",
        disabled && "opacity-60",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((email) => (
        <span
          key={email}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/40 py-0.5 pl-0.5 pr-1.5 text-sm"
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
              avatarTone(email),
            )}
            aria-hidden
          >
            {initialFor(email)}
          </span>
          <span className="truncate">{email}</span>
          <button
            type="button"
            disabled={disabled}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Remove ${email}`}
            onClick={(e) => {
              e.stopPropagation();
              removeEmail(email);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="email"
        autoComplete="email"
        disabled={disabled}
        value={draft}
        placeholder={value.length === 0 ? placeholder : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          setInvalid(false);
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={commitDraft}
        className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
