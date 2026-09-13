"use client";

import { useState, type FormEvent } from "react";
import type { AnalysisResult, EvidenceStatus } from "@/lib/schema";
import styles from "./continuity.module.css";

const statusLabel: Record<EvidenceStatus, string> = {
  verified: "Verified fact",
  reported: "Reported claim",
  interpreted: "Interpretation",
  unknown: "Unknown",
};

const scoreLabels = [
  ["Information strength", "informationStrength"],
  ["Source quality", "sourceQuality"],
  ["Low contamination", "lowContamination"],
  ["Anomaly strength", "anomalyStrength"],
] as const;

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const trimmed = query.trim();
    if (!trimmed) {
      setError("Enter a public case, person, or source to analyse.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis request failed.");
      }

      setResult(payload as AnalysisResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.brandRow}>
          <div className={styles.mark}>CA</div>
          <div>
            <p className={styles.eyebrow}>GPT-6 Astra research prototype</p>
            <h1>Continuity Atlas</h1>
          </div>
        </div>

        <p className={styles.lead}>
          A comparative research system for reported continuity-across-lives cases.
          It does not assume reincarnation is real; it tests competing explanations
          against the same evidence.
        </p>

        <div className={styles.hypotheses}>
          <div>
            <span>H0</span>
            <strong>Conventional explanation</strong>
            <p>Contamination, suggestion, coincidence, development, culture, biology.</p>
          </div>
          <div>
            <span>H1</span>
            <strong>Continuity hypothesis</strong>
            <p>Residual information or traits not adequately explained by H0.</p>
          </div>
          <div>
            <span>H?</span>
            <strong>Insufficient evidence</strong>
            <p>The system may conclude that the hypotheses cannot yet be distinguished.</p>
          </div>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.inputPanel}>
          <p className={styles.sectionLabel}>Research input</p>
          <h2>Analyse a public case</h2>
          <p className={styles.muted}>
            Enter a case name, person, or public source. The current route validates the
            full interface; the live Astra research call is the next integration step.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label htmlFor="case-query">Case, person, or source</label>
            <textarea
              id="case-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: a documented public case or a source URL"
              rows={4}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Building evidence map…" : "Build evidence map"}
            </button>
            {error ? <p className={styles.error}>{error}</p> : null}
          </form>
        </div>

        <aside className={styles.pipeline}>
          <p className={styles.sectionLabel}>Astra pipeline</p>
          <ol>
            <li>Research public sources and preserve provenance</li>
            <li>Extract into the 43-variable research schema</li>
            <li>Separate fact, report, interpretation, and unknown</li>
            <li>Evaluate conventional explanations</li>
            <li>Evaluate continuity separately</li>
            <li>Score evidence quality and anomaly</li>
            <li>Compare cases and generate a testable next hypothesis</li>
          </ol>
        </aside>
      </section>

      <section className={styles.outputs} aria-live="polite">
        <div className={styles.outputHeader}>
          <div>
            <p className={styles.sectionLabel}>Research output</p>
            <h2>{result ? result.caseTitle : "Three auditable outputs"}</h2>
          </div>
          {result ? <div className={styles.totalScore}>{result.scores.total}/20</div> : null}
        </div>

        {!result ? (
          <div className={styles.emptyGrid}>
            <article>
              <span>01</span>
              <h3>Case Evidence Map</h3>
              <p>What is actually documented, with epistemic status attached to each item.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Competing Explanations</h3>
              <p>Conventional and continuity hypotheses assessed without privileging either.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Cross-Case Patterns</h3>
              <p>Recurring features and testable hypotheses, without converting correlation into causation.</p>
            </article>
          </div>
        ) : (
          <div className={styles.resultStack}>
            <p className={styles.summary}>{result.summary}</p>

            <div className={styles.resultGrid}>
              <article className={styles.card}>
                <h3>Case Evidence Map</h3>
                <div className={styles.evidenceList}>
                  {result.evidence.map((item) => (
                    <div key={`${item.label}-${item.value}`}>
                      <span className={`${styles.status} ${styles[item.status]}`}>
                        {statusLabel[item.status]}
                      </span>
                      <strong>{item.label}</strong>
                      <p>{item.value}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.card}>
                <h3>Competing Explanations</h3>
                <div className={styles.explanation}>
                  <h4>{result.conventional.title}</h4>
                  <p>{result.conventional.assessment}</p>
                  <h4>{result.continuity.title}</h4>
                  <p>{result.continuity.assessment}</p>
                </div>
                <p className={styles.uncertainty}>{result.uncertainty}</p>
              </article>
            </div>

            <div className={styles.resultGrid}>
              <article className={styles.card}>
                <h3>Evidence score</h3>
                <div className={styles.scoreList}>
                  {scoreLabels.map(([label, key]) => (
                    <div key={key}>
                      <span>{label}</span>
                      <strong>{result.scores[key]}/5</strong>
                    </div>
                  ))}
                </div>
                <p className={styles.note}>The score ranks evidential strength; it does not prove reincarnation.</p>
              </article>

              <article className={styles.card}>
                <h3>Cross-Case Patterns</h3>
                <ul className={styles.patterns}>
                  {result.patterns.map((pattern) => (
                    <li key={pattern}>{pattern}</li>
                  ))}
                </ul>
                <h4>Next testable hypothesis</h4>
                <p>{result.nextHypothesis}</p>
              </article>
            </div>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <span>Continuity Atlas</span>
        <span>Evidence first · uncertainty preserved · hypotheses kept separate</span>
      </footer>
    </main>
  );
}
