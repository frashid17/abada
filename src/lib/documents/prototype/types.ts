export type PrototypeDocId = "fundadores" | "incentivos" | "pi";

export type PrototypeArticle = {
  id: string;
  n: string;
  t_es: string;
  t_en: string;
  does_es: string;
  does_en: string;
  matters_es: string;
  matters_en: string;
  note_es?: string;
  note_en?: string;
  dec?: string;
  cl?: Array<string | { h: string }>;
};

export type PrototypeGroup = {
  g_es: string;
  g_en: string;
  arts: PrototypeArticle[];
};

export type PrototypeDoc = {
  t_es: string;
  t_en: string;
  sub_es: string;
  sub_en: string;
  full_es?: string;
  full_en?: string;
  groups: PrototypeGroup[];
};

export type PrototypeDecisionOption = {
  v: string;
  t: string;
  te: string;
  c_es?: string;
  c_en?: string;
  rec?: number;
};

export type PrototypeDecision = {
  es: string;
  en: string;
  type: "choice" | "num" | string;
  def?: string | number;
  q_es: string;
  q_en: string;
  hint_es?: string;
  hint_en?: string;
  unit_es?: string;
  unit_en?: string;
  options?: PrototypeDecisionOption[];
};

export type PrototypeTokenMeta = {
  es: string;
  en: string;
  ph?: string;
  sample_es?: string;
  sample_en?: string;
  type?: string;
  long?: boolean;
};

export type PrototypeContentBundle = {
  order: PrototypeDocId[];
  docs: Record<PrototypeDocId, PrototypeDoc>;
  decisions: Record<string, PrototypeDecision>;
  tokens: Record<string, PrototypeTokenMeta>;
};

export type PrototypeGlobalsPayload = {
  order: PrototypeDocId[];
  decisions: Record<string, PrototypeDecision>;
  tokens: Record<string, PrototypeTokenMeta>;
};
