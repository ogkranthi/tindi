"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FAMILY_CUISINES } from "@/lib/family";

export default function GeneratePlan({ hasKey }: { hasKey: boolean }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [cuisines, setCuisines] = useState<string[]>(FAMILY_CUISINES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCuisine(c: string) {
    setCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/meal-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, cuisines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-stone-900">Generate a new week</h2>
      <p className="mt-1 text-sm text-stone-600">
        Tailored to everyone&apos;s health profile. Add anything special about this week.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {FAMILY_CUISINES.map((c) => (
          <button
            key={c}
            onClick={() => toggleCuisine(c)}
            className={`chip border ${
              cuisines.includes(c)
                ? "border-herb-600 bg-herb-100 text-herb-700"
                : "border-stone-300 bg-white text-stone-500"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Dad travels Wed–Thu, want lots of leftovers, extra fish this week…"
        className="mt-3 w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-herb-500 focus:outline-none focus:ring-1 focus:ring-herb-500"
        rows={2}
      />

      <div className="mt-3 flex items-center gap-3">
        <button onClick={generate} disabled={loading || !hasKey} className="btn-primary">
          {loading ? "Planning your week…" : "✨ Generate meal plan"}
        </button>
        {!hasKey && (
          <span className="text-xs text-amber-700">Add OPENROUTER_API_KEY to enable.</span>
        )}
      </div>
      {loading && (
        <p className="mt-2 text-xs text-stone-500">
          This calls the model and can take ~20–40s. The grocery list is built automatically.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
