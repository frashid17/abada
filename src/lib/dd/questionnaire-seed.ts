import type { DdRiskCategory, DdRiskLevel } from "@/lib/dd/taxonomy";

export type DdQuestionSection =
  | "fundadores"
  | "incentivos"
  | "pi"
  | "declaration"
  | "cross";

export type DdQuestionAnswerType = "yes_no" | "yes_no_na" | "text";

export type DdQuestionSeed = {
  slug: string;
  sectionKey: DdQuestionSection;
  sortOrder: number;
  qEs: string;
  qEn: string;
  hintEs?: string;
  hintEn?: string;
  answerType: DdQuestionAnswerType;
  riskCategory: DdRiskCategory;
  riskLevelIfGap: DdRiskLevel;
  findingEs: string;
  findingEn: string;
  actionEs?: string;
  actionEn?: string;
};

/** Seed bank aligned to the three guided packs + declaration/cross gaps. */
export const DD_QUESTION_SEEDS: readonly DdQuestionSeed[] = [
  {
    slug: "fundadores-firmado",
    sectionKey: "fundadores",
    sortOrder: 10,
    qEs: "¿Existe un acuerdo de fundadores firmado por todos los fundadores actuales?",
    qEn: "Is there a founders agreement signed by every current founder?",
    hintEs: "Sin firma, el vesting y las restricciones de transferencia no son oponibles.",
    hintEn: "Without signatures, vesting and transfer restrictions are hard to enforce.",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "alto",
    findingEs:
      "No hay evidencia de un acuerdo de fundadores firmado por todas las partes. El régimen de vesting, leaver y transferencia puede no ser oponible.",
    findingEn:
      "No evidence of a founders agreement signed by all parties. Vesting, leaver, and transfer rules may be unenforceable.",
    actionEs: "Circular y firmar el acuerdo de fundadores; archivar versión ejecutada en la sala.",
    actionEn: "Circulate and sign the founders agreement; file the executed version in the room.",
  },
  {
    slug: "fundadores-vesting-operativo",
    sectionKey: "fundadores",
    sortOrder: 20,
    qEs: "¿El vesting del acuerdo está respaldado por recompra, restricción en el libro de accionistas u opción de compra?",
    qEn: "Is vesting backed by repurchase, a restriction in the shareholders register, or a purchase option?",
    hintEs: "Una cláusula correcta sin mecanismo operativo deja dead equity en la mesa.",
    hintEn: "A correct clause without an operative mechanic leaves dead equity on the table.",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "alto",
    findingEs:
      "El vesting no tiene mecanismo operativo (recompra / libro / opción). Un fundador que sale puede conservar acciones no consolidadas.",
    findingEn:
      "Vesting lacks an operative mechanic (repurchase / register / option). A departing founder may keep unvested shares.",
    actionEs: "Implementar recompra o restricción registral alineada con el acuerdo.",
    actionEn: "Implement repurchase or a register restriction aligned with the agreement.",
  },
  {
    slug: "fundadores-drag-umbral",
    sectionKey: "fundadores",
    sortOrder: 30,
    qEs: "¿El umbral de arrastre (drag-along) está definido numéricamente en el acuerdo?",
    qEn: "Is the drag-along threshold defined numerically in the agreement?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "medio",
    findingEs:
      "El umbral de arrastre está en blanco o indefinido. La cláusula no tiene efecto práctico para obligar a vender.",
    findingEn:
      "The drag-along threshold is blank or undefined. The clause has no practical effect to compel a sale.",
    actionEs: "Completar el umbral (p. ej. 75%) y republicar el acuerdo.",
    actionEn: "Fill in the threshold (e.g. 75%) and re-issue the agreement.",
  },
  {
    slug: "fundadores-debt-cap",
    sectionKey: "fundadores",
    sortOrder: 40,
    qEs: "¿Está definido el tope de endeudamiento que exige mayoría reforzada?",
    qEn: "Is the debt cap that triggers supermajority approval defined?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "medio",
    findingEs:
      "La materia reservada de endeudamiento no tiene tope cuantificado (debt cap). La protección de gobernanza queda incompleta.",
    findingEn:
      "The reserved borrowing matter has no quantified debt cap. Governance protection is incomplete.",
    actionEs: "Fijar el tope en COP relativo a la caja y actualizar el acuerdo.",
    actionEn: "Set the COP cap relative to cash runway and update the agreement.",
  },
  {
    slug: "fundadores-estatutos-alineados",
    sectionKey: "fundadores",
    sortOrder: 50,
    qEs: "¿Las restricciones de transferencia del acuerdo están reflejadas en los estatutos?",
    qEn: "Are the agreement’s transfer restrictions reflected in the bylaws?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "alto",
    findingEs:
      "Restricciones de transferencia existen en el acuerdo pero no en estatutos. Pueden no ser oponibles frente a la sociedad o terceros.",
    findingEn:
      "Transfer restrictions exist in the agreement but not in the bylaws. They may not bind the company or third parties.",
    actionEs: "Reformar estatutos para reflejar ROFR, tag y drag; protocolizar.",
    actionEn: "Amend bylaws to reflect ROFR, tag, and drag; formalize filings.",
  },
  {
    slug: "incentivos-aprobado",
    sectionKey: "incentivos",
    sortOrder: 10,
    qEs: "¿El plan de incentivos / ESOP fue aprobado por asamblea (o el órgano competente)?",
    qEn: "Was the incentive / ESOP plan approved by the shareholders meeting (or competent body)?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "alto",
    findingEs:
      "No hay evidencia de aprobación societaria del plan de incentivos. Los otorgamientos bajo ese plan son cuestionables.",
    findingEn:
      "No evidence of corporate approval of the incentive plan. Grants under that plan are questionable.",
    actionEs: "Adoptar el plan por acta de asamblea y archivar el acta en la sala.",
    actionEn: "Adopt the plan by shareholder minutes and file them in the room.",
  },
  {
    slug: "incentivos-pool-vs-autorizado",
    sectionKey: "incentivos",
    sortOrder: 20,
    qEs: "¿La bolsa de incentivos cabe dentro del capital autorizado vigente?",
    qEn: "Does the incentive pool fit within current authorized capital?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "alto",
    findingEs:
      "La bolsa de incentivos no está respaldada por capital autorizado suficiente. Cada opción puede ser inválida.",
    findingEn:
      "The incentive pool is not backed by sufficient authorized capital. Each option may be invalid.",
    actionEs: "Aumentar capital autorizado o reducir la bolsa; documentar la decisión.",
    actionEn: "Increase authorized capital or reduce the pool; document the decision.",
  },
  {
    slug: "incentivos-cartas",
    sectionKey: "incentivos",
    sortOrder: 30,
    qEs: "¿Hay cartas de otorgamiento firmadas para cada persona con opciones o acciones restringidas?",
    qEn: "Are there signed grant letters for every person with options or restricted shares?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "medio",
    findingEs:
      "Faltan cartas de otorgamiento firmadas. El equity prometido no tiene soporte contractual individual.",
    findingEn:
      "Signed grant letters are missing. Promised equity lacks individual contractual support.",
    actionEs: "Emitir y firmar cartas de otorgamiento; actualizar el cap table fully diluted.",
    actionEn: "Issue and sign grant letters; update the fully diluted cap table.",
  },
  {
    slug: "incentivos-promesas-verbales",
    sectionKey: "incentivos",
    sortOrder: 40,
    qEs: "¿Existen promesas verbales de equity que aún no están documentadas?",
    qEn: "Are there verbal equity promises that are still undocumented?",
    hintEs: "Responde “sí” si hay promesas pendientes de documentar (eso genera hallazgo).",
    hintEn: "Answer “yes” if promises are still undocumented (that creates a finding).",
    answerType: "yes_no_na",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "alto",
    findingEs:
      "Hay promesas verbales de equity sin documentación. Riesgo de disputas y dilución no controlada.",
    findingEn:
      "There are verbal equity promises without documentation. Risk of disputes and uncontrolled dilution.",
    actionEs: "Documentar o retirar cada promesa; alinear con el plan aprobado.",
    actionEn: "Document or withdraw each promise; align with the approved plan.",
  },
  {
    slug: "pi-cesion-fundadores",
    sectionKey: "pi",
    sortOrder: 10,
    qEs: "¿Todos los fundadores firmaron cesión de propiedad intelectual a favor de la sociedad?",
    qEn: "Have all founders signed an IP assignment in favor of the company?",
    answerType: "yes_no",
    riskCategory: "propiedad_intelectual",
    riskLevelIfGap: "alto",
    findingEs:
      "Falta cesión de PI de uno o más fundadores. La compañía no puede demostrar titularidad de su propio producto.",
    findingEn:
      "IP assignment is missing from one or more founders. The company cannot prove ownership of its own product.",
    actionEs: "Firmar cesiones de PI con todos los fundadores y archivarlas.",
    actionEn: "Execute IP assignments with all founders and file them.",
  },
  {
    slug: "pi-empleados-contratistas",
    sectionKey: "pi",
    sortOrder: 20,
    qEs: "¿Empleados y contratistas con acceso a código o producto firmaron confidencialidad y cesión de PI?",
    qEn: "Have employees and contractors with product/code access signed confidentiality and IP assignment?",
    answerType: "yes_no",
    riskCategory: "propiedad_intelectual",
    riskLevelIfGap: "alto",
    findingEs:
      "Cadena de titularidad incompleta: colaboradores con acceso al producto sin cesión/confidencialidad firmada.",
    findingEn:
      "Incomplete ownership chain: contributors with product access lack signed IP/confidentiality.",
    actionEs: "Completar matriz de PI y firmar acuerdos pendientes.",
    actionEn: "Complete the IP matrix and execute outstanding agreements.",
  },
  {
    slug: "pi-preexistente",
    sectionKey: "pi",
    sortOrder: 30,
    qEs: "¿La PI preexistente de fundadores quedó declarada y licenciada a la sociedad?",
    qEn: "Was founders’ pre-existing IP disclosed and licensed to the company?",
    answerType: "yes_no_na",
    riskCategory: "propiedad_intelectual",
    riskLevelIfGap: "medio",
    findingEs:
      "PI preexistente no está declarada/licenciada. Riesgo de reclamaciones sobre componentes del producto.",
    findingEn:
      "Pre-existing IP is not disclosed/licensed. Risk of claims over product components.",
    actionEs: "Completar anexo de PI preexistente y licencia a la sociedad.",
    actionEn: "Complete the pre-existing IP schedule and license to the company.",
  },
  {
    slug: "declaration-repos",
    sectionKey: "declaration",
    sortOrder: 10,
    qEs: "¿Los repositorios, dominios y cuentas cloud críticas están bajo control corporativo (no cuentas personales)?",
    qEn: "Are critical repositories, domains, and cloud accounts under corporate control (not personal accounts)?",
    answerType: "yes_no",
    riskCategory: "propiedad_intelectual",
    riskLevelIfGap: "alto",
    findingEs:
      "Activos tecnológicos críticos en cuentas personales. Un excolaborador puede retener accesos o interrumpir servicios.",
    findingEn:
      "Critical tech assets sit in personal accounts. A former contributor may retain access or disrupt services.",
    actionEs: "Migrar a cuentas corporativas, MFA y offboarding formal.",
    actionEn: "Migrate to corporate accounts, MFA, and formal offboarding.",
  },
  {
    slug: "declaration-cap-table",
    sectionKey: "declaration",
    sortOrder: 20,
    qEs: "¿El cap table está reconciliado con el libro de accionistas y títulos?",
    qEn: "Is the cap table reconciled with the shareholders register and certificates?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "alto",
    findingEs:
      "Cap table no reconciliado con libro/títulos. Condición precedente típica de un fondo.",
    findingEn:
      "Cap table not reconciled with register/certificates. Typical fund condition precedent.",
    actionEs: "Reconciliar y certificar el cap table antes de la ronda.",
    actionEn: "Reconcile and certify the cap table before the round.",
  },
  {
    slug: "declaration-litigios",
    sectionKey: "declaration",
    sortOrder: 30,
    qEs: "¿Hay litigios, reclamaciones o contingencias materiales no documentadas en la sala?",
    qEn: "Are there material disputes, claims, or contingencies not documented in the room?",
    hintEs: "Responde “sí” si existen y aún no están en la sala.",
    hintEn: "Answer “yes” if they exist and are not yet in the room.",
    answerType: "yes_no_na",
    riskCategory: "litigios",
    riskLevelIfGap: "medio",
    findingEs:
      "Hay contingencias o litigios materiales no cargados en la sala. El fondo no puede cuantificar exposición.",
    findingEn:
      "Material contingencies or disputes are not uploaded. The fund cannot quantify exposure.",
    actionEs: "Divulgar listado de litigios/contingencias y cargar evidencias.",
    actionEn: "Disclose the disputes/contingencies list and upload evidence.",
  },
  {
    slug: "declaration-datos",
    sectionKey: "declaration",
    sortOrder: 40,
    qEs: "¿La compañía trata datos personales con política de privacidad y bases legales documentadas (Ley 1581)?",
    qEn: "Does the company process personal data with a documented privacy policy and legal bases (Law 1581)?",
    answerType: "yes_no_na",
    riskCategory: "datos_privacidad",
    riskLevelIfGap: "medio",
    findingEs:
      "Tratamiento de datos sin política/bases documentadas. Riesgo regulatorio y contractual con clientes.",
    findingEn:
      "Personal data processing without documented policy/bases. Regulatory and customer-contract risk.",
    actionEs: "Adoptar política de privacidad y registro de tratamientos.",
    actionEn: "Adopt a privacy policy and processing register.",
  },
  {
    slug: "cross-nit-consistente",
    sectionKey: "cross",
    sortOrder: 10,
    qEs: "¿Nombre de la sociedad, NIT y domicilio coinciden en acuerdo de fundadores, plan de incentivos y cesión de PI?",
    qEn: "Do company name, tax ID, and domicile match across founders, incentive, and IP agreements?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "medio",
    findingEs:
      "Inconsistencias de identificación societaria entre documentos. Matriz de inconsistencias pendiente.",
    findingEn:
      "Company identification inconsistencies across documents. Inconsistency matrix outstanding.",
    actionEs: "Unificar datos societarios y republicar documentos afectados.",
    actionEn: "Unify company particulars and re-issue affected documents.",
  },
  {
    slug: "cross-firmas-facultades",
    sectionKey: "cross",
    sortOrder: 20,
    qEs: "¿Quién firmó cada documento tenía facultades suficientes (representante legal / apoderado)?",
    qEn: "Did each signatory have sufficient authority (legal representative / attorney-in-fact)?",
    answerType: "yes_no",
    riskCategory: "corporativo_registral",
    riskLevelIfGap: "alto",
    findingEs:
      "No se verificó que los firmantes tuvieran facultades suficientes. Riesgo de ineficacia de actos.",
    findingEn:
      "Signatory authority was not verified. Risk that instruments are ineffective.",
    actionEs: "Adjuntar certificados de existencia/representación y ratificar si hace falta.",
    actionEn: "Attach existence/representation certificates and ratify if needed.",
  },
] as const;
