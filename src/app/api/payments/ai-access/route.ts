import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  AI_DRAFTING_AMOUNT_CENTS,
  AI_DRAFTING_CURRENCY,
  formatCopFromCents,
  userHasAiAccess,
} from "@/lib/payments/ai-access";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paywallEnabled = isFeatureEnabled("aiPaywall");
  const hasAccess = await userHasAiAccess(userId);

  return NextResponse.json({
    hasAccess,
    paywallEnabled,
    amountCents: AI_DRAFTING_AMOUNT_CENTS,
    currency: AI_DRAFTING_CURRENCY,
    amountFormatted: formatCopFromCents(AI_DRAFTING_AMOUNT_CENTS),
  });
}
