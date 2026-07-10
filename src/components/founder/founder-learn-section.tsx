import { getLocale } from "next-intl/server";
import { DocumentLearnView } from "@/components/founder/document-learn-view";
import { getShareholdersLearnDocument } from "@/lib/documents/learn/get-learn-document";

export async function FounderLearnSection() {
  const locale = (await getLocale()) as "es-CO" | "en-US";
  const payload = await getShareholdersLearnDocument(locale);

  return <DocumentLearnView payload={payload} />;
}
