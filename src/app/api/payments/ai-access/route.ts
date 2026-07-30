import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { getAiAccessStatus } from "@/lib/payments/ai-access";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = (await getLocale()) as "es-CO" | "en-US";
  return NextResponse.json(await getAiAccessStatus(userId, locale));
}
