import type { AnalysisResult } from "@/lib/schema";

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
    "provenance",
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
            enum: ["verified", "reported", "interpreted", "unknown"],
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
    provenance: { type: "array", items: { type: "string" } },
  },
} as const;

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

function extractSearchSources(response: ResponsesApiResult): string[] {
  const sources: string[] = [];
  for (const item of response.output ?? []) {
    for (const source of item.action?.sources ?? []) {
      if (source.url) {
        sources.push(source.title ? `${source.title} — ${source.url}` : source.url);
      }
    }
  }
  return [...new Set(sources)];
}

export async function analyseWithAstra(query: string): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  const instructions = `You are the research engine for Continuity Atlas. Investigate publicly documented claims about possible continuity across lives without assuming that reincarnation exists. Use web research and distinguish verified facts, reported claims, interpretations, and unknowns. Prefer primary, academic, institutional, or well-documented sources; use weaker sources only when necessary and mark their limitations. Check chronology and possible information contamination. Evaluate conventional explanations first, then evaluate the continuity hypothesis using the same evidence. Do not convert correlation into causation. The score ranks evidential strength, not truth of reincarnation. If evidence cannot discriminate between hypotheses, state that explicitly. For a single case, do not pretend that true cross-case patterns have already been established.`;

  const input = `Research this public case or source: ${query}\n\nReturn a concise but substantive case analysis. Evidence Map items should emphasize the most decision-relevant facts for the 43-variable Continuity Atlas research schema: chronology, concrete claims, independent verification, errors, affect/phobias/preferences, abilities, physical traits, documentation timing, witnesses, contamination channels, and time course. Score information strength, source quality, low contamination, and residual anomaly from 0 to 5; total must equal their sum. The provenance field should name the most important sources used.`;

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

  const result = JSON.parse(outputText) as AnalysisResult;
  result.scores.total =
    result.scores.informationStrength +
    result.scores.sourceQuality +
    result.scores.lowContamination +
    result.scores.anomalyStrength;

  const searchedSources = extractSearchSources(payload);
  if (searchedSources.length) {
    result.provenance = [...new Set([...result.provenance, ...searchedSources])];
  }

  return result;
}
