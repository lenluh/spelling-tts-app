"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildFreshSession, DEFAULT_WORDS, loadJSON, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { SessionResults } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<SessionResults | null>(null);

  useEffect(() => {
    const stored = loadJSON<SessionResults>(STORAGE_KEYS.results);
    if (stored) {
      if (stored.accuracy === 1) {
        router.replace("/results/perfect");
        return;
      }
      setResults(stored);
      return;
    }

    const words = loadJSON<string[]>(STORAGE_KEYS.words) ?? DEFAULT_WORDS;
    const fresh = buildFreshSession(words, false);
    saveJSON(STORAGE_KEYS.session, fresh);
    router.replace("/");
  }, [router]);

  const percent = useMemo(() => {
    if (!results) return "0%";
    return `${(results.accuracy * 100).toFixed(1)}%`;
  }, [results]);

  const practiceAgain = () => {
    const words = loadJSON<string[]>(STORAGE_KEYS.words) ?? DEFAULT_WORDS;
    const fresh = buildFreshSession(words, false);
    saveJSON(STORAGE_KEYS.session, fresh);
    router.push("/practice");
  };

  if (!results) return <main className="page"><p className="card">Loading results…</p></main>;

  return (
    <main className="page">
      <section className="card" aria-label="Session results summary">
        <h1>Results</h1>
        <p className="big">Words Correct: {results.numberCorrect} / {results.totalWords}</p>
        <p className="big">Total Attempts: {results.totalAttempts}</p>
        <p className="big">Accuracy: {percent}</p>

        <div className="controls">
          <button className="btn" onClick={practiceAgain} aria-label="Practice again with same list">Practice Again</button>
          <button className="btn" onClick={() => router.push("/")} aria-label="Go to title page and practice other words">Practice other words</button>
        </div>
      </section>

      <section className="card" aria-label="Per word performance">
        <h2>Word Details</h2>

        <ul className="resultsList">
          {results.perWord.map((item, i) => (
            <li key={`${item.word}-${i}`} className="resultItem resultItemRow">
              <span className={`word ${item.attempts > 1 ? "wordNeedsPractice" : ""}`}>{item.word}</span>
              <span>Attempts: {item.attempts}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
