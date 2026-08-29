import content from "@/lib/documents/prototype/content.json";
import type {
  PrototypeContentBundle,
  PrototypeDocId,
  PrototypeDoc,
  PrototypeDecision,
} from "@/lib/documents/prototype/types";

const raw = content as {
  order: PrototypeDocId[];
  docs: Record<PrototypeDocId, PrototypeDoc>;
  decisions: Record<string, PrototypeDecision>;
  tokens: PrototypeContentBundle["tokens"];
};

/** Code seed — fallback when no published CMS revision exists. */
export const SEED_PROTOTYPE_CONTENT: PrototypeContentBundle = {
  order: raw.order,
  docs: raw.docs,
  decisions: raw.decisions,
  tokens: raw.tokens,
};
