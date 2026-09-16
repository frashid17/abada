import "server-only";

import fs from "node:fs";
import path from "node:path";
import { EMAIL_BRAND_LOGO_CID } from "@/lib/brand-assets";

export type BrandLogoEmailAttachment = {
  filename: string;
  content: Buffer;
  contentId: string;
};

/** Read logo bytes for Resend CID embedding (works in local + production). */
export function readBrandLogoEmailAttachment(): BrandLogoEmailAttachment | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "brand", "abada-logo.png");
    if (!fs.existsSync(logoPath)) return null;
    return {
      filename: "abada-logo.png",
      content: fs.readFileSync(logoPath),
      contentId: EMAIL_BRAND_LOGO_CID,
    };
  } catch {
    return null;
  }
}
