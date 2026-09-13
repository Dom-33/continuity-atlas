export type EvidenceStatus = "verified" | "reported" | "interpreted" | "unknown";

export type EvidenceItem = {
  label: string;
  value: string;
  status: EvidenceStatus;
};

export type Explanation = {
  title: string;
  assessment: string;
  support: string[];
  limits: string[];
};

export type ScoreProfile = {
  informationStrength: number;
  sourceQuality: number;
  lowContamination: number;
  anomalyStrength: number;
  total: number;
};

export type AnalysisResult = {
  caseTitle: string;
  summary: string;
  evidence: EvidenceItem[];
  conventional: Explanation;
  continuity: Explanation;
  scores: ScoreProfile;
  patterns: string[];
  nextHypothesis: string;
  uncertainty: string;
  provenance: string[];
};
