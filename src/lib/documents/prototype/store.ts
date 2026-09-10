"use client";

import { useCallback, useSyncExternalStore } from "react";

export type PrototypeCompany = {
  nombre: string;
  nit: string;
  domicilio: string;
  ciudad: string;
  negocio: string;
  fecha: string;
  repLegal: string;
  repCargo: string;
  colab?: string;
  colabId?: string;
};

export type PrototypeFounder = {
  nombre: string;
  id: string;
  domicilio: string;
  correo: string;
  rol: string;
  dedic: string;
  acciones: string;
  pct: string;
};

export type PrototypeStore = {
  company: PrototypeCompany;
  founders: PrototypeFounder[];
  decisions: Record<string, string | number>;
  seen: Record<string, Record<string, boolean>>;
};

const STORAGE_KEY = "abada.prototype.documents.v1";
const STORE_EVENT = "abada:prototype-documents";

const emptyFounder = (): PrototypeFounder => ({
  nombre: "",
  id: "",
  domicilio: "",
  correo: "",
  rol: "",
  dedic: "",
  acciones: "",
  pct: "",
});

export const emptyPrototypeStore = (): PrototypeStore => ({
  company: {
    nombre: "",
    nit: "",
    domicilio: "",
    ciudad: "",
    negocio: "",
    fecha: "",
    repLegal: "",
    repCargo: "",
  },
  founders: [emptyFounder(), emptyFounder()],
  decisions: {},
  seen: {},
});

const EMPTY_STORE = emptyPrototypeStore();

let cachedRaw: string | null = null;
let cachedStore: PrototypeStore = EMPTY_STORE;

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private mode / blocked storage must never crash the page.
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Quota or privacy mode — keep the in-memory cache only.
  }
}

function parseStore(raw: string | null): PrototypeStore {
  if (!raw) return EMPTY_STORE;
  try {
    const parsed = JSON.parse(raw) as Partial<PrototypeStore>;
    const empty = emptyPrototypeStore();
    const companyIn =
      parsed.company && typeof parsed.company === "object"
        ? (parsed.company as Partial<PrototypeCompany>)
        : {};
    const company: PrototypeCompany = { ...empty.company };
    for (const key of Object.keys(empty.company) as Array<keyof PrototypeCompany>) {
      const value = asString(companyIn[key]);
      if (value !== null) company[key] = value;
    }
    const colab = asString(companyIn.colab);
    const colabId = asString(companyIn.colabId);
    if (colab !== null) company.colab = colab;
    if (colabId !== null) company.colabId = colabId;

    const foundersIn = Array.isArray(parsed.founders) ? parsed.founders : null;
    const decisionsIn =
      parsed.decisions && typeof parsed.decisions === "object" && !Array.isArray(parsed.decisions)
        ? (parsed.decisions as Record<string, unknown>)
        : {};
    const seenIn =
      parsed.seen && typeof parsed.seen === "object" && !Array.isArray(parsed.seen)
        ? (parsed.seen as Record<string, unknown>)
        : {};

    const decisions: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(decisionsIn)) {
      if (typeof value === "string" || typeof value === "number") {
        decisions[key] = value;
      }
    }

    const seen: Record<string, Record<string, boolean>> = {};
    for (const [docId, articles] of Object.entries(seenIn)) {
      if (!articles || typeof articles !== "object" || Array.isArray(articles)) continue;
      const next: Record<string, boolean> = {};
      for (const [articleId, flag] of Object.entries(articles as Record<string, unknown>)) {
        if (flag) next[articleId] = true;
      }
      seen[docId] = next;
    }

    return {
      ...empty,
      company,
      founders: foundersIn?.length
        ? foundersIn.map((founder) => {
            const next = emptyFounder();
            const founderIn =
              founder && typeof founder === "object"
                ? (founder as Partial<PrototypeFounder>)
                : {};
            for (const key of Object.keys(next) as Array<keyof PrototypeFounder>) {
              const value = asString(founderIn[key]);
              if (value !== null) next[key] = value;
            }
            return next;
          })
        : empty.founders,
      decisions,
      seen,
    };
  } catch {
    return EMPTY_STORE;
  }
}

/** Cached getSnapshot — must return the same reference when data is unchanged. */
function getClientSnapshot(): PrototypeStore {
  if (typeof window === "undefined") return EMPTY_STORE;
  const raw = readLocalStorage(STORAGE_KEY);
  if (raw === cachedRaw) return cachedStore;
  cachedRaw = raw;
  cachedStore = parseStore(raw);
  return cachedStore;
}

function writeStore(next: PrototypeStore) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(next);
  writeLocalStorage(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedStore = next;
  try {
    window.dispatchEvent(new Event(STORE_EVENT));
  } catch {
    // ignore
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener(STORE_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(STORE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): PrototypeStore {
  return EMPTY_STORE;
}

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function usePrototypeDocumentStore() {
  const store = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const persist = useCallback((next: PrototypeStore) => {
    writeStore(next);
  }, []);

  const updateCompany = useCallback(
    (patch: Partial<PrototypeCompany>) => {
      persist({ ...store, company: { ...store.company, ...patch } });
    },
    [persist, store],
  );

  const updateFounder = useCallback(
    (index: number, patch: Partial<PrototypeFounder>) => {
      const founders = store.founders.map((founder, i) =>
        i === index ? { ...founder, ...patch } : founder,
      );
      persist({ ...store, founders });
    },
    [persist, store],
  );

  const setDecision = useCallback(
    (key: string, value: string | number) => {
      persist({ ...store, decisions: { ...store.decisions, [key]: value } });
    },
    [persist, store],
  );

  const markSeen = useCallback(
    (docId: string, articleId: string) => {
      const seen = {
        ...store.seen,
        [docId]: { ...(store.seen[docId] ?? {}), [articleId]: true },
      };
      persist({ ...store, seen });
    },
    [persist, store],
  );

  const tokenValue = useCallback(
    (key: string): string => {
      const map: Record<string, unknown> = {
        "co.nombre": store.company?.nombre,
        "co.nit": store.company?.nit,
        "co.domicilio": store.company?.domicilio,
        "co.ciudad": store.company?.ciudad,
        "co.negocio": store.company?.negocio,
        "co.fecha": store.company?.fecha,
        "co.repLegal": store.company?.repLegal,
        "co.repCargo": store.company?.repCargo,
        "colab.nombre": store.company?.colab,
        "colab.id": store.company?.colabId,
        "f1.nombre": store.founders[0]?.nombre,
        "f1.id": store.founders[0]?.id,
        "f1.dom": store.founders[0]?.domicilio,
        "f1.rol": store.founders[0]?.rol,
        "f2.nombre": store.founders[1]?.nombre,
        "f2.id": store.founders[1]?.id,
        "f2.dom": store.founders[1]?.domicilio,
        "f2.rol": store.founders[1]?.rol,
      };
      return safeTrim(map[key]);
    },
    [store],
  );

  const setTokenValue = useCallback(
    (key: string, value: string) => {
      if (key.startsWith("co.") || key.startsWith("colab.")) {
        const field =
          key === "colab.nombre"
            ? "colab"
            : key === "colab.id"
              ? "colabId"
              : key.slice(3);
        updateCompany({ [field]: value } as Partial<PrototypeCompany>);
        return;
      }
      if (key.startsWith("f1.") || key.startsWith("f2.")) {
        const index = key.startsWith("f1.") ? 0 : 1;
        const field = key.slice(3) === "dom" ? "domicilio" : key.slice(3);
        updateFounder(index, { [field]: value } as Partial<PrototypeFounder>);
      }
    },
    [updateCompany, updateFounder],
  );

  return {
    store,
    hydrated,
    persist,
    updateCompany,
    updateFounder,
    setDecision,
    markSeen,
    tokenValue,
    setTokenValue,
  };
}
