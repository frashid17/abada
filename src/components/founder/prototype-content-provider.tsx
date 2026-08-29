"use client";

import { createContext, useContext } from "react";
import type { PrototypeContentBundle } from "@/lib/documents/prototype/types";
import { SEED_PROTOTYPE_CONTENT } from "@/lib/documents/prototype/seed";

const PrototypeContentContext = createContext<PrototypeContentBundle>(SEED_PROTOTYPE_CONTENT);

export function PrototypeContentProvider({
  content,
  children,
}: {
  content: PrototypeContentBundle;
  children: React.ReactNode;
}) {
  return (
    <PrototypeContentContext.Provider value={content}>{children}</PrototypeContentContext.Provider>
  );
}

export function usePrototypeContent(): PrototypeContentBundle {
  return useContext(PrototypeContentContext);
}
