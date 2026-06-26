import {
  FileCheck2,
  FileText,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
