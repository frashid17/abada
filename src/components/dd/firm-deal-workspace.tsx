"use client";

import { useTranslations } from "next-intl";
import { SplitWorkspace } from "@/components/layout/split-workspace";

type FirmDealWorkspaceProps = {
  room: React.ReactNode;
  review: React.ReactNode;
};

export function FirmDealWorkspace({ room, review }: FirmDealWorkspaceProps) {
  const t = useTranslations("firm.dd");

  return (
    <SplitWorkspace
      primary={room}
      secondary={review}
      primaryLabel={t("paneRoom")}
      secondaryLabel={t("paneReview")}
      panesLabel={t("workspacePanes")}
    />
  );
}
