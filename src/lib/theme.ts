export const THEME_STORAGE_KEY = "theme";
export const THEME_COOKIE_KEY = "theme";

export type ThemeSetting = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function parseThemeSetting(value: string | undefined | null): ThemeSetting | null {
  if (value === "light" || value === "dark" || value === "system") return value;
  return null;
}

export function resolveTheme(setting: ThemeSetting): ResolvedTheme {
  if (setting === "dark") return "dark";
  if (setting === "light") return "light";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export function readThemeSetting(fallback: ThemeSetting = "system"): ThemeSetting {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const parsed = parseThemeSetting(stored);
    if (parsed) return parsed;
  } catch {
    // localStorage unavailable
  }
  return fallback;
}

export function persistThemeSetting(setting: ThemeSetting): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, setting);
    document.cookie = `${THEME_COOKIE_KEY}=${setting};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  } catch {
    // storage unavailable
  }
}

/** Server render: only explicit dark avoids hydration flash; system resolves on client. */
export function serverHtmlDarkClass(setting: ThemeSetting): string | undefined {
  return setting === "dark" ? "dark" : undefined;
}
