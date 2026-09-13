import type { AnalysisResult, SourceRef, SourceTier } from "@/lib/schema";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "caseTitle",
    "summary",
    "evidence",
    "conventional",
    "continuity",
    "scores",
    "patterns",
    "nextHypothesis",
    "uncertainty",
  ],
  properties: {
    caseTitle: { type: "string" },
    summary: { type: "string" },
    evidence: {
      type: "array",
      minItems: 1,
      maxItems: 14,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value", "status"],
        properties: {
          label: { type: "string" },
          value: { type: "string" },
          status: {
            type: "string",
            enum: ["documented", "reported", "interpreted", "unknown"],
          },
        },
      },
    },
    conventional: {
      type: "object",
      additionalProperties: false,
      required: ["title", "assessment", "support", "limits"],
      properties: {
        title: { type: "string" },
        assessment: { type: "string" },
        support: { type: "array", items: { type: "string" } },
        limits: { type: "array", items: { type: "string" } },
      },
    },
    continuity: {
      type: "object",
      additionalProperties: false,
      required: ["title", "assessment", "support", "limits"],
      properties: {
        title: { type: "string" },
        assessment: { type: "string" },
        support: { type: "array", items: { type: "string" } },
        limits: { type: "array", items: { type: "string" } },
      },
    },
    scores: {
      type: "object",
      additionalProperties: false,
      required: [
        "informationStrength",
        "sourceQuality",
        "lowContamination",
        "anomalyStrength",
        "total",
      ],
      properties: {
        informationStrength: { type: "integer", minimum: 0, maximum: 5 },
        sourceQuality: { type: "integer", minimum: 0, maximum: 5 },
        lowContamination: { type: "integer", minimum: 0, maximum: 5 },
        anomalyStrength: { type: "integer", minimum: 0, maximum: 5 },
        total: { type: "integer", minimum: 0, maximum: 20 },
      },
    },
    patterns: { type: "array", items: { type: "string" } },
    nextHypothesis: { type: "string" },
    uncertainty: { type: "string" },
  },
} as const;

type ModelAnalysis = Omit<AnalysisResult, "provenance">;
type ResponseContent = { type?: string; text?: string };
type ResponseOutputItem = {
  type?: string;
  content?: ResponseContent[];
  action?: { sources?: Array<{ title?: string; url?: string }> };
};
type ResponsesApiResult = {
  output?: ResponseOutputItem[];
  error?: { message?: string };
};

function extractOutputText(response: ResponsesApiResult): string | null {
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return null;
}

function normalizeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function classifySource(domain: string): SourceTier {
  if (
    domain.endsWith(".gov") ||
    domain.endsWith(".mil") ||
    domain.includes("archives.gov") ||
    domain.includes("loc.gov")
  ) {
    return "primary";
  }

  if (
    domain.includes("virginia.edu") ||
    domain.includes("sciencedirect.com") ||
    domain.includes("springer.com") ||
    domain.includes("wiley.com") ||
    domain.includes("tandfonline.com") ||
    domain.includes("sagepub.com") ||
    domain.includes("journalofscientificexploration.org") ||
    domain.includes("researchgate.net")
  ) {
    return "academic";
  }

  if (
    domain.includes("reddit.com") ||
    domain.includes("scribd.com") ||
    domain.includes("psychologytoday.com") ||
    domain.includes("theosophical.org") ||
    domain.includes("reincarnationcentre.org")
  ) {
    return "weak";
  }

  return "secondary";
}

function analysisCorpus(result: ModelAnalysis): string {
  return [
    result.caseTitle,
    result.summary,
    ...result.evidence.flatMap((item) => [item.label, item.value]),
    result.conventional.title,
    result.conventional.assessment,
    ...result.conventional.support,
    ...result.conventional.limits,
    result.continuity.title,
    result.continuity.assessment,
    ...result.continuity.support,
    ...result.continuity.limits,
    ...result.patterns,
    result.nextHypothesis,
    result.uncertainty,
  ]
    .join(" ")
    .toLowerCase();
}

function extractSearchSources(
  response: ResponsesApiResult,
  result: ModelAnalysis,
): SourceRef[] {
  const byUrl = new Map<string, SourceRef>();
  const corpus = analysisCorpus(result);

  for (const item of response.output ?? []) {
    for (const source of item.action?.sources ?? []) {
      if (!source.url) continue;
      const domain = normalizeDomain(source.url);
      byUrl.set(source.url, {
        title: source.title?.trim() || domain,
        url: source.url,
        domain,
        tier: classifySource(domain),
        usedInAnalysis: corpus.includes(domain),
      });
    }
  }

  return [...byUrl.values()].sort((a, b) => {
    const rank: Record<SourceTier, number> = {
      primary: 0,
      academic: 1,
      secondary: 2,
      weak: 3,
    };
    return Number(b.usedInAnalysis) - Number(a.usedInAnalysis) || rank[a.tier] - rank[b.tier];
  });
}

function cleanText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/\s*\(https?:\/\/[^)]+\)/g, "")
    .replace(/\s+https?:\/\/\S+/g, "")
    .replace(/\s*\((?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^)]*)?\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanAnalysis(result: ModelAnalysis): ModelAnalysis {
  return {
    ...result,
    caseTitle: cleanText(result.caseTitle),
    summary: cleanText(result.summary),
    evidence: result.evidence.map((item) => ({
      ...item,
      label: cleanText(item.label),
      value: cleanText(item.value),
    })),
    conventional: {
      ...result.conventional,
      title: cleanText(result.conventional.title),
      assessment: cleanText(result.conventional.assessment),
      support: result.conventional.support.map(cleanText),
      limits: result.conventional.limits.map(cleanText),
    },
    continuity: {
      ...result.continuity,
      title: cleanText(result.continuity.title),
      assessment: cleanText(result.continuity.assessment),
      support: result.continuity.support.map(cleanText),
      limits: result.continuity.limits.map(cleanText),
    },
    patterns: result.patterns.map(cleanText),
    nextHypothesis: cleanText(result.nextHypothesis),
    uncertainty: cleanText(result.uncertainty),
  };
}

export async function analyseWithAstra(query: string): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  const instructions = `You are the research engine for Continuity Atlas. Investigate publicly documented claims about possible continuity across lives without assuming that reincarnation exists. Use web research and preserve epistemic distinctions. Evidence status meanings: documented = supported by an identifiable documentary source, but not automatically independently verified; reported = attributed testimony or claim; interpreted = inference or analytical judgment; unknown = not established from available evidence. If a fact is independently verified, say that explicitly in the value rather than treating all documented material as independent verification. Prefer primary, academic, institutional, archival, or well-documented sources; use weaker sources only when necessary and mark their limitations. Check chronology and possible information contamination. Evaluate conventional explanations first, then evaluate the continuity hypothesis using the same evidence. Do not convert correlation into causation. The score ranks evidential strength, not truth of reincarnation. If evidence cannot discriminate between hypotheses, state that explicitly. For a single case, do not claim that a true cross-case pattern has been established. Do not include URLs, domain names in parentheses, markdown links, or citation markers inside any text field; source links are handled separately by the application.`;

  const input = `Research this public case or source: ${query}\n\nReturn a concise but substantive case analysis. Evidence Map items should emphasize the most decision-relevant facts for the 43-variable Continuity Atlas research schema: chronology, concrete claims, independent verification, errors, affect/phobias/preferences, abilities, physical traits, documentation timing, witnesses, contamination channels, and time course. For both H0 and H1, provide a short assessment plus concrete support points and explicit limits. Score information strength, source quality, low contamination, and residual anomaly from 0 to 5; total must equal their sum.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-6-astra",
      store: false,
      reasoning: { effort: "medium" },
      max_output_tokens: 5000,
      tools: [{ type: "web_search" }],
      tool_choice: "auto",
      include: ["web_search_call.action.sources"],
      instructions,
      input,
      text: {
        format: {
          type: "json_schema",
          name: "continuity_atlas_analysis",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  const payload = (await response.json()) as ResponsesApiResult;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI request failed with ${response.status}.`);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("Astra returned no structured analysis text.");
  }

  const result = cleanAnalysis(JSON.parse(outputText) as ModelAnalysis);
  result.scores.total =
    result.scores.informationStrength +
    result.scores.sourceQuality +
    result.scores.lowContamination +
    result.scores.anomalyStrength;

  return {
    ...result,
    provenance: extractSearchSources(payload, result),
  };
}
