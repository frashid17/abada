import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ sourceId: string }>;
};

/** Legacy path — edit form lives on `/admin/corpus?editar=…`. */
export default async function AdminCorpusEditRedirectPage({ params }: PageProps) {
  const { sourceId } = await params;
  redirect(`/admin/corpus?editar=${encodeURIComponent(sourceId)}`);
}
