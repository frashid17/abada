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

function parseStore(raw: string | null): PrototypeStore {
  if (!raw) return EMPTY_STORE;
  try {
    const parsed = JSON.parse(raw) as Partial<PrototypeStore>;
    return {
      ...emptyPrototypeStore(),
      ...parsed,
      company: { ...emptyPrototypeStore().company, ...parsed.company },
      founders: parsed.founders?.length
        ? parsed.founders.map((founder) => ({ ...emptyFounder(), ...founder }))
        : emptyPrototypeStore().founders,
      decisions: { ...(parsed.decisions ?? {}) },
      seen: { ...(parsed.seen ?? {}) },
    };
  } catch {
    return EMPTY_STORE;
  }
}

/** Cached getSnapshot — must return the same reference when data is unchanged. */
function getClientSnapshot(): PrototypeStore {
  if (typeof window === "undefined") return EMPTY_STORE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedStore;
  cachedRaw = raw;
  cachedStore = parseStore(raw);
  return cachedStore;
}

function writeStore(next: PrototypeStore) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedStore = next;
  window.dispatchEvent(new Event(STORE_EVENT));
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
      const map: Record<string, string | undefined> = {
        "co.nombre": store.company.nombre,
        "co.nit": store.company.nit,
        "co.domicilio": store.company.domicilio,
        "co.ciudad": store.company.ciudad,
        "co.negocio": store.company.negocio,
        "co.fecha": store.company.fecha,
        "co.repLegal": store.company.repLegal,
        "co.repCargo": store.company.repCargo,
        "colab.nombre": store.company.colab,
        "colab.id": store.company.colabId,
        "f1.nombre": store.founders[0]?.nombre,
        "f1.id": store.founders[0]?.id,
        "f1.dom": store.founders[0]?.domicilio,
        "f1.rol": store.founders[0]?.rol,
        "f2.nombre": store.founders[1]?.nombre,
        "f2.id": store.founders[1]?.id,
        "f2.dom": store.founders[1]?.domicilio,
        "f2.rol": store.founders[1]?.rol,
      };
      return map[key]?.trim() ?? "";
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
