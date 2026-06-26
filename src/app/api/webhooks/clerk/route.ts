import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(secret);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (event.type === "user.created") {
    const user = event.data;
    await supabase.from("profiles").upsert(
      {
        clerk_user_id: user.id,
        context: "founder",
        display_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        email: user.email_addresses?.[0]?.email_address ?? null,
        avatar_url: user.image_url ?? null,
        onboarding_complete: false,
      },
      { onConflict: "clerk_user_id" },
    );
  }

  return new Response("ok", { status: 200 });
}
