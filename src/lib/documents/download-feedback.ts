import { getBrandName, getFirmName } from "@/lib/brand";
import {
  buildBrandedEmailHtml,
  isEmailConfigured,
  sendEmail,
} from "@/lib/email/send";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import {
  isInvestmentDocumentType,
  type InvestmentDocumentType,
} from "@/lib/documents/catalog";
import { isPrototypeDocId, type PrototypeDocId } from "@/lib/documents/prototype/catalog";

/** Keys used for download-feedback rows (investment docs + preparation pack). */
export type FeedbackDocumentType =
  | InvestmentDocumentType
  | PrototypeDocId
  | "prototype_review";

export type DocumentDownloadFeedbackInput = {
  documentType: FeedbackDocumentType;
  easeRating: number;
  whatWouldChange: string;
  hardestTopic: string;
  foundersWithoutLawyer: string;
  lawyerTimeNeeded: string;
  respondentName?: string | null;
};

export type DocumentDownloadFeedbackRecord = {
  id: string;
  ownerSub: string;
  documentType: string;
  respondentEmail: string;
  respondentName: string | null;
  easeRating: number;
  createdAt: string;
};

/** Short grant window after submit so the PDF can download without reopening the form. */
export const FEEDBACK_DOWNLOAD_GRANT_MS = 15 * 60 * 1000;

const DOCUMENT_TYPE_LABELS_ES: Record<FeedbackDocumentType, string> = {
  nda: "NDA mutuo",
  vesting: "Vesting de fundadores",
  ip: "Cesión de propiedad intelectual",
  employment: "Contrato laboral investment-ready",
  shareholders: "Acuerdo de accionistas",
  fundadores: "Acuerdo de fundadores",
  incentivos: "Acuerdo de compensación en equity",
  pi: "Cesión de propiedad intelectual (PI)",
  prototype_review:
    "Revisión final — paquete de preparación (Fundadores + Equity + PI)",
};

export function feedbackDocumentLabel(documentType: FeedbackDocumentType): string {
  return DOCUMENT_TYPE_LABELS_ES[documentType];
}

export function isFeedbackDocumentType(value: string): value is FeedbackDocumentType {
  return (
    isInvestmentDocumentType(value) ||
    isPrototypeDocId(value) ||
    value === "prototype_review"
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function feedbackRecipients(): string[] {
  const raw =
    process.env.DOCUMENT_FEEDBACK_TO?.trim() ||
    "meghan@balamlegal.co,alberto.bravo@balamlegal.co,fr3722@gmail.com";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** True only if feedback was submitted recently enough to unlock this download. */
export async function hasDocumentDownloadFeedback(
  ownerSub: string,
  documentType: FeedbackDocumentType,
  withinMs: number = FEEDBACK_DOWNLOAD_GRANT_MS,
): Promise<boolean> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const since = new Date(Date.now() - withinMs).toISOString();
    const { data, error } = await supabase
      .from("document_download_feedback")
      .select("id")
      .eq("owner_sub", ownerSub)
      .eq("document_type", documentType)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[document-feedback] hasDocumentDownloadFeedback", error);
      return false;
    }
    return Boolean(data);
  } catch (error) {
    console.error("[document-feedback] hasDocumentDownloadFeedback", error);
    return false;
  }
}

export async function submitDocumentDownloadFeedback(input: {
  ownerSub: string;
  respondentEmail: string;
  payload: DocumentDownloadFeedbackInput;
}): Promise<DocumentDownloadFeedbackRecord> {
  const email = input.respondentEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("invalid_email");
  }

  const rating = input.payload.easeRating;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("invalid_rating");
  }

  const whatWouldChange = input.payload.whatWouldChange.trim();
  const hardestTopic = input.payload.hardestTopic.trim();
  const foundersWithoutLawyer = input.payload.foundersWithoutLawyer.trim();
  const lawyerTimeNeeded = input.payload.lawyerTimeNeeded.trim();
  const respondentName = input.payload.respondentName?.trim() || null;

  if (!whatWouldChange || !hardestTopic || !foundersWithoutLawyer || !lawyerTimeNeeded) {
    throw new Error("incomplete");
  }

  const supabase = createServiceRoleSupabaseClient();
  const row = {
    owner_sub: input.ownerSub,
    document_type: input.payload.documentType,
    respondent_email: email,
    respondent_name: respondentName,
    ease_rating: rating,
    what_would_change: whatWouldChange,
    hardest_topic: hardestTopic,
    founders_without_lawyer: foundersWithoutLawyer,
    lawyer_time_needed: lawyerTimeNeeded,
    created_at: new Date().toISOString(),
  };

  let data:
    | {
        id: string;
        owner_sub: string;
        document_type: string;
        respondent_email: string;
        respondent_name: string | null;
        ease_rating: number;
        created_at: string;
      }
    | null = null;

  const inserted = await supabase
    .from("document_download_feedback")
    .insert(row)
    .select(
      "id, owner_sub, document_type, respondent_email, respondent_name, ease_rating, created_at",
    )
    .single();

  if (inserted.error?.code === "23505") {
    // Migration 026 not applied yet — update the existing unique row so download can proceed.
    const updated = await supabase
      .from("document_download_feedback")
      .update({
        respondent_email: email,
        respondent_name: respondentName,
        ease_rating: rating,
        what_would_change: whatWouldChange,
        hardest_topic: hardestTopic,
        founders_without_lawyer: foundersWithoutLawyer,
        lawyer_time_needed: lawyerTimeNeeded,
        created_at: new Date().toISOString(),
      })
      .eq("owner_sub", input.ownerSub)
      .eq("document_type", input.payload.documentType)
      .select(
        "id, owner_sub, document_type, respondent_email, respondent_name, ease_rating, created_at",
      )
      .single();
    if (updated.error) throw updated.error;
    data = updated.data;
  } else if (inserted.error) {
    throw inserted.error;
  } else {
    data = inserted.data;
  }

  if (!data) throw new Error("generic");

  await writeAuditLog({
    action: "document.download_feedback.submitted",
    actorSub: input.ownerSub,
    resourceType: "document",
    resourceId: input.payload.documentType,
    metadata: {
      feedbackId: data.id,
      easeRating: rating,
      respondentEmail: email,
      documentLabel: feedbackDocumentLabel(input.payload.documentType),
    },
  });

  try {
    await notifyDocumentFeedbackEmail({
      documentType: input.payload.documentType,
      respondentEmail: email,
      respondentName,
      easeRating: rating,
      whatWouldChange,
      hardestTopic,
      foundersWithoutLawyer,
      lawyerTimeNeeded,
    });
  } catch (notifyError) {
    console.error("[document-feedback] notify failed", notifyError);
  }

  return {
    id: data.id,
    ownerSub: data.owner_sub,
    documentType: data.document_type,
    respondentEmail: data.respondent_email,
    respondentName: data.respondent_name,
    easeRating: data.ease_rating,
    createdAt: data.created_at,
  };
}

function ratingDots(rating: number): string {
  const filled = "●".repeat(rating);
  const empty = "○".repeat(Math.max(0, 5 - rating));
  return `${filled}${empty}  ${rating}/5`;
}

async function notifyDocumentFeedbackEmail(input: {
  documentType: FeedbackDocumentType;
  respondentEmail: string;
  respondentName: string | null;
  easeRating: number;
  whatWouldChange: string;
  hardestTopic: string;
  foundersWithoutLawyer: string;
  lawyerTimeNeeded: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const recipients = feedbackRecipients();
  if (recipients.length === 0) return;

  const brand = getBrandName();
  const firm = getFirmName();
  const docLabel = feedbackDocumentLabel(input.documentType);
  const nameLine = input.respondentName?.trim() || "No indicado";
  const submittedAt = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const answerCards: { label: string; value: string }[] = [
    {
      label: "Facilita la comprensión de documentos legales",
      value: ratingDots(input.easeRating),
    },
    {
      label: "Qué cambiaría en la herramienta",
      value: input.whatWouldChange,
    },
    {
      label: "Tema más difícil de comprender",
      value: input.hardestTopic,
    },
    {
      label: "¿Fundadores sin apoyo personalizado de abogado?",
      value: input.foundersWithoutLawyer,
    },
    {
      label: "Tiempo de asesoría personalizada que necesitaría",
      value: input.lawyerTimeNeeded,
    },
  ];

  const bodyHtml = `
    <div style="margin:0 0 20px;">
      <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#fff4ed;color:#c45c26;font-size:12px;font-weight:700;letter-spacing:0.02em;line-height:1.4;">
        ${escapeHtml(docLabel)}
      </span>
    </div>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#334155;">
      Nueva opinión enviada desde <strong style="color:#0b1f33;">${escapeHtml(brand)}</strong>.
    </p>
    <p style="margin:0 0 22px;font-size:13px;line-height:1.5;color:#64748b;">
      ${escapeHtml(submittedAt)} · hora Colombia
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:0 10px;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e8eef5;border-radius:14px;padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Correo del usuario</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#0b1f33;word-break:break-word;">
            <a href="mailto:${escapeHtml(input.respondentEmail)}" style="color:#0b1f33;text-decoration:none;">${escapeHtml(input.respondentEmail)}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc;border:1px solid #e8eef5;border-radius:14px;padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Nombre</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#0b1f33;word-break:break-word;">${escapeHtml(nameLine)}</p>
        </td>
      </tr>
      <tr>
        <td style="background:#0b1f33;border-radius:14px;padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Documento</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;line-height:1.45;word-break:break-word;">${escapeHtml(docLabel)}</p>
        </td>
      </tr>
      ${answerCards
        .map(
          (card) => `
      <tr>
        <td style="background:#ffffff;border:1px solid #e8eef5;border-radius:14px;padding:14px 16px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${escapeHtml(card.label)}</p>
          <p style="margin:0;font-size:14px;line-height:1.55;color:#0b1f33;white-space:pre-wrap;word-break:break-word;">${escapeHtml(card.value)}</p>
        </td>
      </tr>`,
        )
        .join("")}
    </table>

    <p style="margin:22px 0 0;font-size:13px;line-height:1.55;color:#64748b;">
      Responde este correo para contactar a
      <a href="mailto:${escapeHtml(input.respondentEmail)}" style="color:#c45c26;font-weight:600;text-decoration:none;">${escapeHtml(input.respondentEmail)}</a>.
    </p>
  `;

  const text = [
    `Nueva opinión de documento — ${brand}`,
    `Documento: ${docLabel}`,
    `Correo: ${input.respondentEmail}`,
    `Nombre: ${nameLine}`,
    `Facilita comprensión (1-5): ${input.easeRating}`,
    `Qué cambiaría: ${input.whatWouldChange}`,
    `Tema más difícil: ${input.hardestTopic}`,
    `Fundadores sin abogado: ${input.foundersWithoutLawyer}`,
    `Tiempo de asesoría: ${input.lawyerTimeNeeded}`,
    `Enviado: ${submittedAt}`,
  ].join("\n\n");

  const branded = buildBrandedEmailHtml({
    title: "Nueva opinión de documento",
    eyebrow: firm,
    bodyHtml,
    footer: `Notificación automática de ${brand} para el equipo de ${firm}.`,
  });

  const result = await sendEmail({
    to: recipients,
    subject: `${brand}: ${docLabel} — ${input.respondentEmail}`,
    html: branded.html,
    text,
    replyTo: input.respondentEmail,
    attachments: branded.attachments,
  });

  if (!result.ok) {
    console.error("[document-feedback] email send failed", result.error);
  }
}
