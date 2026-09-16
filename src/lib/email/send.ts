import { Resend } from "resend";
import { getBrandName } from "@/lib/brand";
import {
  EMAIL_BRAND_LOGO_CID,
  getEmailBrandLogoUrl,
  readBrandLogoEmailAttachment,
} from "@/lib/brand-assets";

export type SendEmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentId?: string;
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Overrides RESEND_REPLY_TO when set (e.g. respondent email for feedback). */
  replyTo?: string;
  attachments?: SendEmailAttachment[];
};

function emailFrom() {
  // Must use a domain verified in Resend (abadalegal.com is verified).
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "it@abadalegal.com";
  const fromName = process.env.RESEND_FROM_NAME?.trim() || getBrandName();
  return `${fromName} <${fromEmail}>`;
}

function defaultReplyTo() {
  return process.env.RESEND_REPLY_TO?.trim() || undefined;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "email_not_configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const payload: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
      text: string;
      replyTo?: string;
      attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentId?: string;
      }>;
    } = {
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    };
    const reply = input.replyTo?.trim() || defaultReplyTo();
    if (reply) payload.replyTo = reply;
    if (input.attachments?.length) {
      payload.attachments = input.attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        ...(attachment.contentId ? { contentId: attachment.contentId } : {}),
      }));
    }

    const { error } = await resend.emails.send(payload);

    if (error) {
      console.error("[email] Resend error", error);
      return { ok: false, error: error.message || "email_send_failed" };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] send failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "email_send_failed",
    };
  }
}

export type BrandedEmailParts = {
  html: string;
  attachments: SendEmailAttachment[];
};

/**
 * Modern, mobile-friendly branded HTML.
 * Prefers a public HTTPS logo URL; otherwise embeds the logo as a CID attachment.
 */
export function buildBrandedEmailHtml(input: {
  title: string;
  bodyHtml: string;
  footer: string;
  eyebrow?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): BrandedEmailParts {
  const brand = getBrandName();
  const publicLogoUrl = getEmailBrandLogoUrl();
  const inlineLogo = publicLogoUrl ? null : readBrandLogoEmailAttachment();
  const logoSrc = publicLogoUrl ?? (inlineLogo ? `cid:${EMAIL_BRAND_LOGO_CID}` : "");

  const logoHtml = logoSrc
    ? `<img src="${logoSrc}" alt="${brand}" width="48" height="48" style="display:block;border:0;border-radius:12px;width:48px;height:48px;" />`
    : "";

  const eyebrowHtml = input.eyebrow
    ? `<p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#c45c26;">${input.eyebrow}</p>`
    : "";

  const ctaHtml =
    input.ctaLabel && input.ctaUrl
      ? `<tr>
            <td style="padding:8px 24px 28px;text-align:center;">
              <a href="${input.ctaUrl}" style="display:inline-block;background:#c45c26;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;line-height:1.2;">
                ${input.ctaLabel}
              </a>
            </td>
          </tr>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${input.title}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0b1f33;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${input.title}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f6;width:100%;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#c45c26,#0b1f33);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 24px 12px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">${logoHtml}</td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#0b1f33;">${brand}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 8px;">
              ${eyebrowHtml}
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:#0b1f33;">
                ${input.title}
              </h1>
              <div style="font-size:15px;line-height:1.6;color:#334155;">
                ${input.bodyHtml}
              </div>
            </td>
          </tr>
          ${ctaHtml}
          <tr>
            <td style="padding:8px 24px 28px;">
              <div style="border-top:1px solid #e8eef5;padding-top:16px;font-size:12px;line-height:1.55;color:#94a3b8;text-align:center;">
                ${input.footer}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    html,
    attachments: inlineLogo
      ? [
          {
            filename: inlineLogo.filename,
            content: inlineLogo.content,
            contentId: inlineLogo.contentId,
          },
        ]
      : [],
  };
}
