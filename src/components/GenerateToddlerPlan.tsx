"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ACTIVITY_DOMAINS, type ActivityDomain, type ActivitySetting } from "@/lib/types";

const SETTINGS: { value: ActivitySetting; label: string }[] = [
  { value: "either", label: "Both" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
];

const DOMAIN_LABEL: Record<ActivityDomain, string> = {
  "gross-motor": "Gross motor",
  "fine-motor": "Fine motor",
  language: "Language",
  cognitive: "Thinking",
  "social-emotional": "Social-emotional",
  creativity: "Creativity",
  sensory: "Sensory",
};

export default function GenerateToddlerPlan({
  hasKey,
  childName,
}: {
  hasKey: boolean;
  childName: string;
}) {
  const router = useRouter();
  const [setting, setSetting] = useState<ActivitySetting>("either");
  const [focuses, setFocuses] = useState<ActivityDomain[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFocus(d: ActivityDomain) {
    setFocuses((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/toddler-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setting, focuses, notes }),
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
      <h2 className="font-semibold text-stone-900">Plan a new week for {childName}</h2>
      <p className="mt-1 text-sm text-stone-600">
        Age-appropriate, safe, summer-aware play — balanced across the skills she&apos;s growing.
      </p>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">Where</p>
        <div className="flex flex-wrap gap-2">
          {SETTINGS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSetting(s.value)}
              className={`chip border ${
                setting === s.value
                  ? "border-herb-600 bg-herb-100 text-herb-700"
                  : "border-stone-300 bg-white text-stone-500"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
          Focus skills (optional)
        </p>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => toggleFocus(d)}
              className={`chip border ${
                focuses.includes(d)
                  ? "border-herb-600 bg-herb-100 text-herb-700"
                  : "border-stone-300 bg-white text-stone-500"
              }`}
            >
              {DOMAIN_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. She loves water play, we have a small balcony, naps after lunch…"
        className="mt-3 w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-herb-500 focus:outline-none focus:ring-1 focus:ring-herb-500"
        rows={2}
      />

      <div className="mt-3 flex items-center gap-3">
        <button onClick={generate} disabled={loading || !hasKey} className="btn-primary">
          {loading ? "Planning the week…" : "✨ Generate week of play"}
        </button>
        {!hasKey && (
          <span className="text-xs text-amber-700">Add OPENROUTER_API_KEY to enable.</span>
        )}
      </div>
      {loading && (
        <p className="mt-2 text-xs text-stone-500">
          This calls the model and can take ~20–40s.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
