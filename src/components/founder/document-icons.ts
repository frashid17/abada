import {
  FileCheck2,
  FileText,
  Scale,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PrototypeDocId } from "@/lib/documents/prototype/types";

export const MODULE_ICONS = {
  readiness: FileText,
  diligence: ShieldCheck,
  review: Scale,
} as const satisfies Record<string, LucideIcon>;

export const DOCUMENT_ICONS = {
  nda: ShieldCheck,
  vesting: Users,
  ip: FileCheck2,
  employment: FileText,
  shareholders: Scale,
} as const satisfies Record<string, LucideIcon>;

export const PROTOTYPE_DOC_ICONS: Record<PrototypeDocId, LucideIcon> = {
  fundadores: Users,
  incentivos: Wallet,
  pi: FileCheck2,
};
