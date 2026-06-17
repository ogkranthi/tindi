"use client";

import { useState } from "react";
import type { MemberPlanSufficiency } from "@/lib/plan-nutrition";
import StatRing from "@/components/StatRing";

const STATUS_CHIP: Record<MemberPlanSufficiency["status"], { label: string; cls: string }> = {
  "on-track": { label: "✅ Getting enough", cls: "bg-herb-100 text-herb-700" },
  short: { label: "⚠️ Short on some", cls: "bg-rose-100 text-rose-700" },
  "no-meals": { label: "No meals planned", cls: "bg-stone-100 text-stone-500" },
};

export default function PlanNutritionCheck({
  planId,
  hasKey,
}: {
  planId: string;
  hasKey: boolean;
}) {
  const [results, setResults] = useState<MemberPlanSufficiency[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/meal-plan/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setResults(data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-stone-900">Will this feed everyone enough?</h2>
          <p className="text-xs text-stone-500">
            Forecast from the planned dishes — no logging needed.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading || !hasKey}
          className="chip border border-herb-300 bg-herb-50 text-herb-700 disabled:opacity-50"
        >
          {loading ? "Checking…" : results ? "↻ Re-check" : "🥗 Check this plan"}
        </button>
      </div>

      {!hasKey && (
        <p className="mt-2 text-xs text-amber-700">
          Add OPENROUTER_API_KEY to forecast nutrition from the plan.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {results && (
        <div className="mt-4 space-y-4">
          {results.map((r) => {
            const chip = STATUS_CHIP[r.status];
            return (
              <div key={r.memberId} className="rounded-xl border border-stone-100 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-stone-900">{r.name}</h3>
                  {r.pregnant && (
                    <span className="chip bg-rose-100 text-rose-700">pregnancy</span>
                  )}
                  {r.role === "child" && (
                    <span className="chip bg-purple-100 text-purple-700">growing</span>
                  )}
                  <span className={`chip ml-auto ${chip.cls}`}>{chip.label}</span>
                </div>

                {r.status === "no-meals" ? (
                  <p className="mt-3 text-sm text-stone-500">
                    No meals in this plan are portioned for {r.name} yet.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 flex flex-wrap gap-4">
                      {r.stats.map((s) => (
                        <StatRing
                          key={s.key}
                          label={s.label}
                          value={s.value}
                          target={s.target}
                          unit={s.unit}
                          pct={s.pct}
                        />
                      ))}
                    </div>

                    {r.shortfalls.length > 0 && (
                      <p className="mt-3 text-sm font-medium text-rose-700">
                        Short on: {r.shortfalls.map((s) => `${s.label} (${s.pct}%)`).join(", ")}
                      </p>
                    )}
                    {r.watch.length > 0 && (
                      <p className="mt-1 text-sm text-amber-700">
                        Watch: {r.watch.map((s) => s.label).join(", ")} trending high
                      </p>
                    )}

                    {r.fixes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                          To close the gap
                        </p>
                        <ul className="mt-1 space-y-1">
                          {r.fixes.map((f, i) => (
                            <li key={i} className="flex gap-2 text-sm text-stone-600">
                              <span>➕</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          <p className="text-xs text-stone-400">
            One serving per planned meal, weekly — a forecast of the cooked food, not what&apos;s
            logged.
          </p>
        </div>
      )}
    </div>
  );
}
