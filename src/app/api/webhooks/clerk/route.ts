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
    const email = user.email_addresses?.[0]?.email_address?.trim().toLowerCase() ?? null;
    const row = {
      clerk_user_id: user.id,
      context: "founder" as const,
      display_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
      avatar_url: user.image_url ?? null,
      onboarding_complete: false,
    };

    let { error } = await supabase.from("profiles").upsert(
      { ...row, email },
      { onConflict: "clerk_user_id" },
    );

    if (
      error &&
      email &&
      (error.code === "23505" || error.message.toLowerCase().includes("duplicate"))
    ) {
      await supabase
        .from("profiles")
        .update({ email: null })
        .eq("context", "founder")
        .ilike("email", email)
        .neq("clerk_user_id", user.id);

      ({ error } = await supabase.from("profiles").upsert(
        { ...row, email },
        { onConflict: "clerk_user_id" },
      ));
    }

    if (error) {
      ({ error } = await supabase.from("profiles").upsert(row, { onConflict: "clerk_user_id" }));
    }

    if (error) {
      console.error("[clerk webhook] profile upsert failed", error);
      return new Response("Profile upsert failed", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}
