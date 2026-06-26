export type BrainDocumentMeta = {
  file: string;
  title: string;
  series?: number;
  required?: boolean;
  enabled?: boolean;
  tags?: string[];
};

export type BrainManifest = {
  version: number;
  description?: string;
  loadOrder: string[];
  documents: Record<string, BrainDocumentMeta>;
  extensions?: {
    description?: string;
    directory: string;
    glob: string;
    enabled?: boolean;
  };
  corpus?: {
    description?: string;
    inventoryFile: string;
    enabled?: boolean;
  };
  placeholders?: Record<string, { title: string; status: string }>;
};

export type LoadedBrainDocument = {
  id: string;
  title: string;
  content: string;
  source: "manifest" | "extension";
  series?: number;
  tags?: string[];
};

export type BrainSystemPrompt = {
  documents: LoadedBrainDocument[];
  combined: string;
  missingRequired: string[];
};

export type CorpusInventoryItem = {
  ID: string;
  Item: string;
  "Description / Why the AI needs it"?: string;
  Status?: string;
  Priority?: string;
  Notes?: string;
};

export type CorpusInventory = {
  version: string;
  source: string;
  summary?: {
    total: number;
    by_status?: Record<string, number>;
    by_priority?: Record<string, number>;
  };
  categories: Record<
    string,
    {
      sheet: string;
      count: number;
      items: CorpusInventoryItem[];
    }
  >;
};

export type AiRegister = "attorney" | "founder" | "investor";

export type AiTaskKind =
  | "drafting"
  | "intake_summary"
  | "dd_finding"
  | "knowledge_hub"
  | "general";

export type GatewayRequest = {
  task: AiTaskKind;
  register: AiRegister;
  locale: "es-CO" | "en-US";
  userMessage: string;
  callerSub: string;
  tenantId?: string;
  includeCorpusIndex?: boolean;
  sessionContext?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export type GatewayResponse = {
  text: string;
  disclaimer: string;
  model: string;
  brainDocumentIds: string[];
  passedGuardrails: boolean;
  guardrailNotes: string[];
};
