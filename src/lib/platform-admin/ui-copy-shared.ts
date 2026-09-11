/** Client-safe UI copy helpers (no server imports). */

export type UiCopyLocale = "es-CO" | "en-US";

export type MessagesTree = Record<string, unknown>;

export function flattenMessages(
  tree: MessagesTree,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[path] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flattenMessages(value as MessagesTree, path));
    }
  }
  return out;
}

export function setMessageAtPath(tree: MessagesTree, path: string, value: string): MessagesTree {
  const parts = path.split(".");
  const root: MessagesTree = { ...tree };
  let cursor: MessagesTree = root;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]!;
    const next = cursor[part];
    const cloned =
      next && typeof next === "object" && !Array.isArray(next)
        ? { ...(next as MessagesTree) }
        : {};
    cursor[part] = cloned;
    cursor = cloned;
  }

  cursor[parts[parts.length - 1]!] = value;
  return root;
}

export function deepMergeMessages(base: MessagesTree, overrides: MessagesTree): MessagesTree {
  const result: MessagesTree = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const existing = result[key];
      result[key] = deepMergeMessages(
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? (existing as MessagesTree)
          : {},
        value as MessagesTree,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function findMessageKeysForText(
  flat: Record<string, string>,
  text: string,
): string[] {
  const needle = text.replace(/\s+/g, " ").trim();
  if (!needle) return [];
  const matches: string[] = [];
  for (const [key, value] of Object.entries(flat)) {
    if (value.replace(/\s+/g, " ").trim() === needle) {
      matches.push(key);
    }
  }
  return matches;
}
