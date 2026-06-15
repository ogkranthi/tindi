"use client";

import { useState } from "react";
import type { MemberInsights } from "@/lib/types";

export default function InsightsPanel({
  memberId,
  initial,
  hasKey,
}: {
  memberId: string;
  initial: MemberInsights | null;
  hasKey: boolean;
}) {
  const [insights, setInsights] = useState<MemberInsights | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(force: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setInsights(data.insights);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-herb-50/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-herb-700">
          AI insights
        </span>
        <button
          onClick={() => run(!!insights)}
          disabled={loading || !hasKey}
          className="chip border border-herb-300 bg-white text-herb-700 disabled:opacity-50"
        >
          {loading ? "Thinking…" : insights ? "↻ Refresh" : "✨ Generate"}
        </button>
      </div>

      {!hasKey && (
        <p className="mt-2 text-xs text-amber-700">Add OPENROUTER_API_KEY to enable insights.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {insights ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-stone-700">{insights.summary}</p>
          <ul className="space-y-1">
            {insights.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-stone-600">
                <span>✅</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        hasKey && (
          <p className="mt-2 text-xs text-stone-500">
            Generate a personalized read of this week for their health goals.
          </p>
        )
      )}
    </div>
  );
}
