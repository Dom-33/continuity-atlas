# Continuity Atlas

Continuity Atlas is an AI-assisted comparative research tool for publicly documented cases involving reported continuity-across-lives phenomena.

The project does **not** assume that reincarnation exists and does not attempt to prove it. Its purpose is to structure heterogeneous reports, compare competing explanations, preserve uncertainty, and identify recurring patterns that may support new testable hypotheses.

## Core workflow

GPT-6 Astra is used for a multi-step research process:

1. Research a public case from available sources.
2. Extract evidence into a structured case schema.
3. Separate verified facts, reported claims, interpretations, and unknowns.
4. Evaluate conventional explanations such as information contamination, suggestion, coincidence, atypical development, cultural influence, or biological predispositions.
5. Evaluate the continuity hypothesis separately, without privileging it.
6. Apply an evidence-quality and anomaly scoring framework.
7. Compare cases and identify cross-case patterns or generate a testable next hypothesis.

The system must be able to conclude that the available evidence is insufficient to distinguish between competing hypotheses.

## Main outputs

- **Case Evidence Map** — structured representation of the evidence actually present in a case.
- **Competing Explanations** — conventional and continuity-based explanations evaluated side by side.
- **Cross-Case Patterns** — recurring patterns in memory, affect/personality, abilities, physical traits, and evidence quality.

## MVP

The challenge MVP is intentionally narrow: a small number of pre-analysed public cases plus one live Astra analysis flow. The 43-variable research schema is primarily an internal research structure; the interface presents a concise synthesis rather than exposing every variable directly.

## Technical stack

- Next.js 16
- React 19
- TypeScript
- OpenAI Responses API
- GPT-6 Astra (`gpt-6-astra`)
- Vercel deployment

The OpenAI API key is used server-side only and must never be committed to the repository or exposed in client code.

## Status

Initial Next.js application skeleton created. Astra API access has been validated separately. Current work is focused on the minimal deployable research interface and server-side analysis route.

## License

MIT
