export type DealParticipantRole = "target" | "investor" | "firm";

export type DealRecord = {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
};

export type DealParticipantRecord = {
  id: string;
  dealId: string;
  participantSub: string;
  role: DealParticipantRole;
};

export type CreateDealInput = {
  tenantId: string;
  name: string;
  targetSub: string;
  investorSubs?: string[];
};

export type DataRoomDocumentInput = {
  dealId: string;
  tenantId: string;
  taxonomyCategory: string;
  title: string;
  fileName: string;
  versionNumber?: number;
  ndaGateRequired?: boolean;
};

export type DataRoomDocumentRecord = {
  id: string;
  dealId: string;
  tenantId: string;
  taxonomyCategory: string;
  title: string;
  storagePath: string;
  versionNumber: number;
  fingerprint?: string | null;
  ndaGateRequired: boolean;
};
