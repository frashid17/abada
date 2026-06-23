export type DocumentStatus = "not_started" | "draft" | "in_review" | "complete";

export type InvestmentDocument = {
  id: string;
  nameKey: string;
  status: DocumentStatus;
  complexity: "low" | "medium" | "high";
};

export const investmentDocuments: InvestmentDocument[] = [
  { id: "nda", nameKey: "documents.nda", status: "complete", complexity: "low" },
  { id: "vesting", nameKey: "documents.vesting", status: "in_review", complexity: "medium" },
  { id: "ip", nameKey: "documents.ip", status: "draft", complexity: "medium" },
  { id: "employment", nameKey: "documents.employment", status: "not_started", complexity: "medium" },
  { id: "shareholders", nameKey: "documents.shareholders", status: "not_started", complexity: "high" },
];

export type RiskLevel = "low" | "medium" | "high";

export type RiskCategory = {
  id: string;
  nameKey: string;
  descKey: string;
  level: RiskLevel;
  icon: string;
};

export const riskCategories: RiskCategory[] = [
  { id: "corporate", nameKey: "risk.categories.corporate", descKey: "risk.categories.corporateDesc", level: "low", icon: "🏛️" },
  { id: "ip", nameKey: "risk.categories.ip", descKey: "risk.categories.ipDesc", level: "low", icon: "💡" },
  { id: "labor", nameKey: "risk.categories.labor", descKey: "risk.categories.laborDesc", level: "medium", icon: "👥" },
  { id: "contracts", nameKey: "risk.categories.contracts", descKey: "risk.categories.contractsDesc", level: "low", icon: "📑" },
  { id: "litigation", nameKey: "risk.categories.litigation", descKey: "risk.categories.litigationDesc", level: "high", icon: "⚖️" },
  { id: "compliance", nameKey: "risk.categories.compliance", descKey: "risk.categories.complianceDesc", level: "low", icon: "✅" },
];

export type ReviewTask = {
  id: string;
  title: string;
  type: string;
  client: string;
  priority: string;
  priorityVariant: "high" | "medium" | "low";
  href: string;
};

export const reviewQueue: ReviewTask[] = [
  {
    id: "1",
    title: "Evaluación de riesgo · Nuvexa SAS",
    type: "Debida diligencia",
    client: "Andina Capital",
    priority: "Vence hoy",
    priorityVariant: "high",
    href: "/abogado/revision/nuvexa",
  },
  {
    id: "2",
    title: "Acuerdo de Accionistas",
    type: "Documento",
    client: "Mercavía",
    priority: "2 días",
    priorityVariant: "medium",
    href: "/abogado/revision/mercavia",
  },
  {
    id: "3",
    title: "Cesión de Propiedad Intelectual",
    type: "Documento",
    client: "Agrolink",
    priority: "3 días",
    priorityVariant: "low",
    href: "/abogado/revision/agrolink",
  },
];

export const caseDocuments = [
  "Estatutos SAS.pdf",
  "Cap table.xlsx",
  "Acuerdo de Accionistas.pdf",
  "Contratos de trabajo.zip",
  "Demanda laboral 2025.pdf",
];
