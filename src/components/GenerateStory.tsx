"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FAVORITE_STORY_ANIMALS } from "@/lib/types";

const ANIMAL_EMOJI: Record<string, string> = {
  cow: "🐄",
  pig: "🐷",
  duck: "🦆",
  horse: "🐴",
};

export default function GenerateStory({
  hasKey,
  childName,
}: {
  hasKey: boolean;
  childName: string;
}) {
  const router = useRouter();
  const [animal, setAnimal] = useState<string>(FAVORITE_STORY_ANIMALS[0]);
  const [custom, setCustom] = useState("");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    const chosen = (custom.trim() || animal).trim();
    if (!chosen) {
      setError("Pick or type an animal.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/toddler-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal: chosen, theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setCustom("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-stone-900">Make a story for {childName}</h2>
      <p className="mt-1 text-sm text-stone-600">
        A short, gentle story starring her favorite animal.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {FAVORITE_STORY_ANIMALS.map((a) => (
          <button
            key={a}
            onClick={() => {
              setAnimal(a);
              setCustom("");
            }}
            className={`chip border capitalize ${
              !custom.trim() && animal === a
                ? "border-herb-600 bg-herb-100 text-herb-700"
                : "border-stone-300 bg-white text-stone-500"
            }`}
          >
            {ANIMAL_EMOJI[a] ?? "🐾"} {a}
          </button>
        ))}
      </div>

      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="…or another animal (e.g. elephant, rabbit)"
        className="mt-3 w-full rounded-xl border border-stone-300 p-2.5 text-sm focus:border-herb-500 focus:outline-none focus:ring-1 focus:ring-herb-500"
      />

      <input
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        placeholder="Optional lesson — e.g. sharing, bedtime, being brave"
        className="mt-2 w-full rounded-xl border border-stone-300 p-2.5 text-sm focus:border-herb-500 focus:outline-none focus:ring-1 focus:ring-herb-500"
      />

      <div className="mt-3 flex items-center gap-3">
        <button onClick={generate} disabled={loading || !hasKey} className="btn-primary">
          {loading ? "Writing the story…" : "📖 Write a story"}
        </button>
        {!hasKey && (
          <span className="text-xs text-amber-700">Add OPENROUTER_API_KEY to enable.</span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
