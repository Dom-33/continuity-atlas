import { NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/schema";

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Enter a public case, person, or source to analyse." },
      { status: 400 },
    );
  }

  const result: AnalysisResult = {
    caseTitle: query,
    summary:
      "Research pipeline ready. This placeholder confirms the end-to-end interface before the live GPT-6 Astra research call is enabled.",
    evidence: [
      {
        label: "Input received",
        value: query,
        status: "verified",
      },
      {
        label: "Source research",
        value: "Pending Astra integration",
        status: "unknown",
      },
      {
        label: "43-variable extraction",
        value: "Schema available; extraction not yet run",
        status: "unknown",
      },
    ],
    conventional: {
      title: "Conventional explanations",
      assessment: "Not yet evaluated",
      support: ["Requires source-level evidence and contamination checks."],
      limits: ["No live research has been performed in this placeholder response."],
    },
    continuity: {
      title: "Continuity hypothesis",
      assessment: "Not yet evaluated",
      support: ["Requires the same evidence base used for conventional explanations."],
      limits: ["No hypothesis is privileged before evidence review."],
    },
    scores: {
      informationStrength: 0,
      sourceQuality: 0,
      lowContamination: 0,
      anomalyStrength: 0,
      total: 0,
    },
    patterns: ["Cross-case comparison will activate after analysed cases are available."],
    nextHypothesis:
      "Astra will generate a testable next hypothesis only after evidence extraction and comparison.",
    uncertainty:
      "Current state: insufficient data to discriminate between competing hypotheses.",
    provenance: ["User-provided query only"],
  };

  return NextResponse.json(result);
}
