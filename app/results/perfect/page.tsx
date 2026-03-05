"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildFreshSession, DEFAULT_WORDS, loadJSON, makeResults, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { SessionResults } from "@/lib/types";
import { chooseBestUSVoice, speakWord } from "@/lib/tts";

export default function PerfectResultsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadJSON<SessionResults>(STORAGE_KEYS.results);
    if (!stored) {
      router.replace("/");
      return;
    }

    if (stored.accuracy < 1) {
      router.replace("/results");
      return;
    }

    setReady(true);

    const speakCongrats = () => {
      if (typeof window === "undefined") return;
      const voices = window.speechSynthesis.getVoices();
      const voice = chooseBestUSVoice(voices);
      speakWord("You did awesome!", voice);
    };

    speakCongrats();
    window.speechSynthesis?.addEventListener("voiceschanged", speakCongrats);

    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", speakCongrats);
    };
  }, [router]);

  const practiceAgain = () => {
    const words = loadJSON<string[]>(STORAGE_KEYS.words) ?? DEFAULT_WORDS;
    const fresh = buildFreshSession(words, false);
    saveJSON(STORAGE_KEYS.session, fresh);
    saveJSON(STORAGE_KEYS.results, makeResults(fresh));
    router.push("/practice");
  };

  if (!ready) return <main className="page"><p className="card">Loading…</p></main>;

  return (
    <main className="page">
      <section className="card perfectCard" aria-label="Perfect score celebration">
        <div className="fireworks" aria-hidden="true">
          <span className="burst b1" />
          <span className="burst b2" />
          <span className="burst b3" />
          <span className="burst b4" />
          <span className="burst b5" />
        </div>

        <h1>🎉 PERFECT SCORE! 🎉</h1>
        <p className="big">You crushed it. 100% accuracy!</p>
        <p className="big">Amazing spelling work — seriously awesome.</p>

        <div className="controls">
          <button className="btn" onClick={practiceAgain} aria-label="Practice again with same list">Practice Again</button>
          <button className="btn" onClick={() => router.push("/")} aria-label="Go to title page and practice other words">Practice other words</button>
        </div>
      </section>
    </main>
  );
}
