"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildFreshSession, DEFAULT_WORDS, loadJSON, makeResults, parseWords, saveJSON, STORAGE_KEYS } from "@/lib/storage";

type WordPreset = {
  id: string;
  name: string;
  words: string[];
};

export default function TitlePage() {
  const router = useRouter();
  const [pastedWords, setPastedWords] = useState("");
  const [msg, setMsg] = useState("");
  const [shuffle, setShuffle] = useState(true);
  const [presets, setPresets] = useState<WordPreset[]>([]);

  useEffect(() => {
    const existingWords = loadJSON<string[]>(STORAGE_KEYS.words);
    if (!existingWords || existingWords.length === 0) {
      saveJSON(STORAGE_KEYS.words, DEFAULT_WORDS);
    }

    const loadPresets = async () => {
      try {
        const response = await fetch("/api/presets", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { presets?: WordPreset[] };
        const loadedPresets = data.presets ?? [];
        setPresets(loadedPresets);

        if (loadedPresets.length > 0) {
          setPastedWords((prev) => (prev.trim().length > 0 ? prev : loadedPresets[0].words.join("\n")));
        }
      } catch {
        setPresets([]);
      }
    };

    void loadPresets();
  }, []);

  const applyPreset = (preset: WordPreset) => {
    setPastedWords(preset.words.join("\n"));
    setMsg("");
  };

  const startPractice = () => {
    const fromPaste = parseWords(pastedWords);
    const words = fromPaste.length > 0 ? fromPaste : loadJSON<string[]>(STORAGE_KEYS.words) ?? DEFAULT_WORDS;

    if (!words.length) {
      setMsg("Please paste at least one word.");
      return;
    }

    saveJSON(STORAGE_KEYS.words, words);
    const session = buildFreshSession(words, shuffle);
    saveJSON(STORAGE_KEYS.session, session);
    saveJSON(STORAGE_KEYS.results, makeResults(session));
    router.push("/practice");
  };

  return (
    <main className="page">
      <section className="card" aria-label="Spelling app title and setup">
        <h1>Spelling Trainer 6000 for 3rd grade</h1>

        <div className="uploadBox">
          <h2>Insert words or pick a preset</h2>

          {presets.length > 0 && (
            <>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    className="btn"
                    type="button"
                    onClick={() => applyPreset(preset)}
                    aria-label={`Use ${preset.name} word list`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <label htmlFor="pasteWords">Paste words (one per line)</label>
          <textarea
            id="pasteWords"
            value={pastedWords}
            onChange={(e) => setPastedWords(e.target.value)}
            rows={10}
            placeholder={`apple\ntrain\nplanet`}
            aria-label="Paste words one per line"
          />

          <label className="toggle">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              aria-label="Shuffle words before starting"
            />
            Shuffle words
          </label>

          <button className="btn" type="button" onClick={startPractice} aria-label="Start spelling practice">
            Start Practice
          </button>
          {msg && <p className="uploadMsg">{msg}</p>}
        </div>
      </section>
    </main>
  );
}
