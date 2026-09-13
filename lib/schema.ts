export type EvidenceStatus = "documented" | "reported" | "interpreted" | "unknown";

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

export type SourceTier = "primary" | "academic" | "secondary" | "weak";

export type SourceRef = {
  title: string;
  url: string;
  domain: string;
  tier: SourceTier;
  usedInAnalysis: boolean;
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
  provenance: SourceRef[];
};
