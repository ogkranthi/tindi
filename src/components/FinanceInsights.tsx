"use client";

import { useState } from "react";

export default function FinanceInsights({ hasKey }: { hasKey: boolean }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/finances/insights", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setSummary(data.summary || "");
      setTips(Array.isArray(data.tips) ? data.tips : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-herb-50/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-herb-700">
          AI budget insights
        </span>
        <button
          onClick={run}
          disabled={loading || !hasKey}
          className="chip border border-herb-300 bg-white text-herb-700 disabled:opacity-50"
        >
          {loading ? "Thinking…" : summary ? "↻ Refresh" : "✨ Analyze month"}
        </button>
      </div>

      {!hasKey && (
        <p className="mt-2 text-xs text-amber-700">Add OPENROUTER_API_KEY to enable insights.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {summary ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-stone-700">{summary}</p>
          <ul className="space-y-1">
            {tips.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-stone-600">
                <span>💡</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        hasKey && (
          <p className="mt-2 text-xs text-stone-500">
            Get a plain-language read of this month&apos;s spending with practical, ₹-specific tips.
          </p>
        )
      )}
    </div>
  );
}
