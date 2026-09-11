import { Resend } from "resend";
import { getBrandName } from "@/lib/brand";
import { getBrandLogoAbsoluteUrl } from "@/lib/brand-assets";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function emailFrom() {
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "it@balamlegal.co";
  const fromName = process.env.RESEND_FROM_NAME?.trim() || getBrandName();
  return `${fromName} <${fromEmail}>`;
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
    const { error } = await resend.emails.send({
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

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

export function buildBrandedEmailHtml(input: {
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
}): string {
  const logoUrl = getBrandLogoAbsoluteUrl();
  const brand = getBrandName();

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Georgia,'Times New Roman',serif;color:#0b1f33;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e9ef;">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;">
              <img src="${logoUrl}" alt="${brand}" width="56" height="56" style="display:inline-block;border-radius:12px;" />
              <p style="margin:14px 0 0;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${brand}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${input.title}</h1>
              <div style="font-size:15px;line-height:1.6;color:#334155;">${input.bodyHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;text-align:center;">
              <a href="${input.ctaUrl}" style="display:inline-block;background:#c45c26;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;">
                ${input.ctaLabel}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:#64748b;text-align:center;">
              ${input.footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
