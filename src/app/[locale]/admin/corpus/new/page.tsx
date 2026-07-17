import { redirect } from "next/navigation";

/** Legacy path — create form lives on `/admin/corpus?crear=1`. */
export default function AdminCorpusNewRedirectPage() {
  redirect("/admin/corpus?crear=1");
}
