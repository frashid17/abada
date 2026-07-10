export type KnowledgeHubArticleSeed = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
};

export const KNOWLEDGE_HUB_ARTICLE_SEEDS: KnowledgeHubArticleSeed[] = [
  {
    slug: "documentos-legales-antes-de-inversion",
    title: "¿Qué documentos legales debes tener antes de buscar inversión?",
    excerpt:
      "Los cinco documentos que los fondos colombianos esperan ver antes de una ronda semilla o Serie A.",
    body: `Antes de abrir una sala de datos o firmar un term sheet, los inversionistas revisan un paquete mínimo de documentos corporativos.

En Abada priorizamos cinco piezas: acuerdo de accionistas, vesting de fundadores, cesión de propiedad intelectual, contratos laborales investment-ready y, cuando aplica, un NDA mutuo con el fondo.

Cada documento reduce fricción en due diligence y demuestra que la empresa puede cerrar una ronda sin sorpresas legales.`,
  },
  {
    slug: "acuerdo-de-accionistas-base-ronda",
    title: "Acuerdo de accionistas: la base de toda ronda de inversión",
    excerpt: "Por qué el pacto societario es el primer documento que revisa un fondo.",
    body: `El acuerdo de accionistas define gobierno, transferencias, arrastre, tag-along y protección ante dilución.

Sin un pacto claro, el fondo asume riesgo de bloqueos societarios y cap table desordenada. Un borrador investment-ready acelera la negociación del term sheet y reduce costos legales en la ronda.`,
  },
  {
    slug: "vesting-para-fundadores",
    title: "Vesting para fundadores: por qué los inversionistas lo exigen",
    excerpt: "Alineación de incentivos y protección del fondo ante salidas tempranas.",
    body: `El vesting asegura que los fundadores ganen su equity con el tiempo. Los fondos suelen pedir cliff de 12 meses y un horizonte de 4 años.

Un acuerdo de vesting bien redactado evita discusiones en due diligence y demuestra madurez corporativa desde la primera reunión con inversionistas.`,
  },
  {
    slug: "propiedad-intelectual-empresa",
    title: "Cómo asegurar que tu empresa sea dueña de su propiedad intelectual",
    excerpt: "Cesiones, trabajos por encargo y código desarrollado por terceros.",
    body: `La PI es activo central en startups de tecnología. Los fondos verifican que software, marca y contenido estén cedidos a la sociedad.

Una cesión de PI completa —incluyendo fundadores y contratistas— evita hallazgos críticos en due diligence y protege el valor de la compañía en la ronda.`,
  },
  {
    slug: "contratos-laborales-inversion",
    title: "Contratos laborales listos para inversión: lo que los inversionistas revisan",
    excerpt: "Cláusulas de confidencialidad, PI laboral y no competencia razonable.",
    body: `Los fondos revisan plantillas de contratación para confirmar que empleados clave tienen obligaciones claras y que la empresa puede escalar el equipo.

Contratos investment-ready reducen riesgo laboral y aceleran la revisión del área legal del fondo.`,
  },
  {
    slug: "nda-mutuo-inversionista",
    title: "Cuándo y cómo usar un NDA mutuo con un inversionista",
    excerpt: "Protege información sensible sin frenar la conversación comercial.",
    body: `Un NDA mutuo equilibrado permite compartir métricas, cap table y roadmap con confianza.

Define propósito, plazo y excepciones estándar. Evita NDAs unilaterales agresivos que algunos fondos rechazan de entrada.`,
  },
  {
    slug: "errores-legales-antes-levantar-capital",
    title: "Los 5 errores legales más comunes antes de levantar capital",
    excerpt: "Cap table, PI, laboral, pacto societario y data room desordenada.",
    body: `1. Cap table sin vesting ni acuerdo de accionistas actualizado.
2. PI no cedida a la sociedad.
3. Contratos laborales genéricos sin cláusulas de inversión.
4. Ausencia de NDA cuando se comparte información sensible.
5. Sala de datos sin taxonomía ni versionado.

Corregir estos puntos antes del proceso reduce semanas de fricción con el fondo.`,
  },
  {
    slug: "due-diligence-que-esperar",
    title: "Due diligence: qué esperar cuando un fondo te invita a un proceso",
    excerpt: "Del NDA a la evaluación ejecutiva: el flujo típico en venture en Colombia.",
    body: `Tras el interés inicial, el fondo abre una sala de datos y solicita documentos por categoría de riesgo: corporativo, laboral, tributario, contractual, PI y más.

La firma legal publica hallazgos y una evaluación ejecutiva. Los inversionistas priorizan esa evaluación sobre navegar carpetas sin contexto.`,
  },
  {
    slug: "cap-table-limpia-ronda-semilla",
    title: "Cap table limpia: cómo prepararte para una ronda semilla",
    excerpt: "Estructura accionaria clara antes de negociar valuación.",
    body: `Una cap table ordenada muestra quién es titular real de cada acción, qué equity está sujeto a vesting y si hay side letters pendientes.

Alinea el acuerdo de accionistas con la cap table exportada y evita sorpresas cuando el fondo modela dilución.`,
  },
  {
    slug: "cuando-necesitas-abogado",
    title: "Cuándo necesitas un abogado y cuándo puedes hacerlo solo",
    excerpt: "Dónde la plataforma acelera y dónde la revisión nombrada es indispensable.",
    body: `Abada ayuda a redactar borradores investment-ready con asistencia de IA, pero cada documento con relevancia legal para una ronda debe ser revisado por un abogado nombrado de la firma.

Usa la plataforma para avanzar rápido; escala a revisión humana antes de firmar o compartir con el fondo.`,
  },
];
