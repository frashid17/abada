import { auth } from "@clerk/nextjs/server";
import { LiveTextEditor } from "@/components/admin/live-text-editor";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { getLiveEditorFabVisible } from "@/lib/platform-admin/ui-copy";

/** Server gate: only platform admins get the live text editor chrome. */
export async function PlatformLiveEditorHost() {
  const { userId } = await auth();
  if (!userId || !(await isPlatformAdmin(userId))) return null;

  const fabVisible = await getLiveEditorFabVisible();
  return <LiveTextEditor fabVisible={fabVisible} />;
}
