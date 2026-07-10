import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { listDealParticipants } from "@/lib/deals/service";
import type { DealParticipantRecord } from "@/lib/deals/types";

export type DealParticipantView = DealParticipantRecord & {
  label: string;
};

export async function listDealParticipantsWithLabels(dealId: string): Promise<DealParticipantView[]> {
  const participants = await listDealParticipants(dealId);
  if (participants.length === 0) return [];

  const subs = participants.map((participant) => participant.participantSub);
  const supabase = createServiceRoleSupabaseClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("clerk_user_id, display_name, email")
    .in("clerk_user_id", subs);

  const profileBySub = new Map(
    (profiles ?? []).map((profile) => [
      profile.clerk_user_id,
      profile.display_name ?? profile.email ?? profile.clerk_user_id,
    ]),
  );

  return participants.map((participant) => ({
    ...participant,
    label: profileBySub.get(participant.participantSub) ?? participant.participantSub,
  }));
}
