import type { ValidatedCaseRecord } from "@/lib/schema";

export function corpusContext(cases: ValidatedCaseRecord[]): string {
  if (!cases.length) {
    return "No validated comparison cases are available yet. Do not claim cross-case patterns.";
  }

  return cases
    .map((record) => {
      const analysis = record.analysis;
      const evidence = analysis.evidence
        .slice(0, 6)
        .map((item) => `${item.status}: ${item.label} — ${item.value}`)
        .join(" | ");

      return [
        `CASE ${record.id}`,
        `Title: ${analysis.caseTitle}`,
        `Summary: ${analysis.summary}`,
        `Score: ${analysis.scores.total}/20`,
        `Evidence: ${evidence}`,
        `Uncertainty: ${analysis.uncertainty}`,
      ].join("\n");
    })
    .join("\n\n");
}
