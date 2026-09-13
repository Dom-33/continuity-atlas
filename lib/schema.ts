export type EvidenceStatus = "verified" | "reported" | "interpreted" | "unknown";

export type EvidenceItem = {
  label: string;
  value: string;
  status: EvidenceStatus;
};

export type ScoreProfile = {
  informationStrength: number;
  sourceQuality: number;
  lowContamination: number;
  anomalyStrength: number;
  total: number;
};
