import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function DocumentFlowBackLink() {
  const t = await getTranslations("founder.flow");

  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/fundador/documentos">
        <ArrowLeft className="h-4 w-4" />
        {t("backToDocuments")}
      </Link>
    </Button>
  );
}
