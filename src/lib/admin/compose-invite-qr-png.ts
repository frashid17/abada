import { BRAND_LOGO_PATH } from "@/lib/brand-assets";

export type InviteQrPosterCopy = {
  brandName: string;
  headline: string;
  instruction: string;
  footer: string;
};

/** Split text into lines that fit `maxWidth` using the provided measure fn. */
export function wrapCanvasText(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = words[0]!;

  for (let i = 1; i < words.length; i += 1) {
    const word = words[i]!;
    const candidate = `${current} ${word}`;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

/** Break a long URL into chunks that fit when spaces are unavailable. */
export function wrapUrlForCanvas(
  measure: (text: string) => number,
  url: string,
  maxWidth: number,
): string[] {
  if (measure(url) <= maxWidth) return [url];

  const lines: string[] = [];
  let remaining = url;
  while (remaining.length > 0) {
    if (measure(remaining) <= maxWidth) {
      lines.push(remaining);
      break;
    }
    let cut = Math.max(1, Math.floor(remaining.length / 2));
    while (cut > 1 && measure(remaining.slice(0, cut)) > maxWidth) {
      cut -= 1;
    }
    while (cut < remaining.length && measure(remaining.slice(0, cut + 1)) <= maxWidth) {
      cut += 1;
    }
    lines.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/**
 * Compose a printable poster PNG: brand, QR, instruction, and the invite URL.
 * Browser-only (uses Canvas).
 */
export async function composeInviteQrPosterPng(input: {
  qrDataUrl: string;
  url: string;
  copy: InviteQrPosterCopy;
  logoSrc?: string;
}): Promise<string> {
  const width = 900;
  const height = 1200;
  const padX = 64;
  const contentWidth = width - padX * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // Printable poster colors (canvas needs concrete RGB, not CSS tokens).
  const bg = "#FFFBF5";
  const ink = "#0F172A";
  const muted = "#64748B";
  const rule = "#E2E8F0";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  let y = 56;

  const logo = await loadImage(input.logoSrc ?? BRAND_LOGO_PATH);
  if (logo) {
    const logoSize = 72;
    ctx.drawImage(logo, (width - logoSize) / 2, y, logoSize, logoSize);
    y += logoSize + 20;
  }

  ctx.fillStyle = ink;
  ctx.font = "600 52px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(input.copy.brandName, width / 2, y);
  y += 64;

  ctx.fillStyle = muted;
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  for (const line of wrapCanvasText((t) => ctx.measureText(t).width, input.copy.headline, contentWidth)) {
    ctx.fillText(line, width / 2, y);
    y += 30;
  }
  y += 20;

  ctx.strokeStyle = rule;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX + 80, y);
  ctx.lineTo(width - padX - 80, y);
  ctx.stroke();
  y += 36;

  const qrImage = await loadImage(input.qrDataUrl);
  if (!qrImage) throw new Error("QR image failed to load");
  const qrSize = 480;
  const qrX = (width - qrSize) / 2;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(qrX - 12, y - 12, qrSize + 24, qrSize + 24);
  ctx.strokeStyle = rule;
  ctx.strokeRect(qrX - 12.5, y - 12.5, qrSize + 25, qrSize + 25);
  ctx.drawImage(qrImage, qrX, y, qrSize, qrSize);
  y += qrSize + 40;

  ctx.fillStyle = ink;
  ctx.font = "500 20px system-ui, -apple-system, sans-serif";
  for (const line of wrapCanvasText(
    (t) => ctx.measureText(t).width,
    input.copy.instruction,
    contentWidth,
  )) {
    ctx.fillText(line, width / 2, y);
    y += 28;
  }
  y += 28;

  ctx.fillStyle = muted;
  ctx.font = "400 15px ui-monospace, SFMono-Regular, Menlo, monospace";
  for (const line of wrapUrlForCanvas((t) => ctx.measureText(t).width, input.url, contentWidth)) {
    ctx.fillText(line, width / 2, y);
    y += 22;
  }

  ctx.fillStyle = muted;
  ctx.font = "400 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(input.copy.footer, width / 2, height - 48);

  return canvas.toDataURL("image/png");
}
