import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type DealRoomBackLinkProps = {
  href: string;
  variant: "founder" | "investor";
};

export async function DealRoomBackLink({ href, variant }: DealRoomBackLinkProps) {
  const t = await getTranslations(variant === "founder" ? "founder.sala" : "investor.room");

  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>
        <ArrowLeft className="h-4 w-4" />
        {t("backToRooms")}
      </Link>
    </Button>
  );
}
