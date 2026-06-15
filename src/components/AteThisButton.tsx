"use client";

import { useState } from "react";

// Logs one meal for everyone it's portioned for: a row per (member × category).
export default function AteThisButton({
  date,
  food,
  categories,
  forMembers,
}: {
  date: string;
  food: string;
  categories: string[];
  forMembers: string[];
}) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function logIt() {
    if (state === "saving" || state === "done") return;
    setState("saving");
    const cats = categories.length ? categories : ["protein"]; // ensure at least one row
    const entries = forMembers.flatMap((memberId) =>
      cats.map((category) => ({ memberId, category, food, source: "plan", logDate: date }))
    );
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  const label =
    state === "done" ? "✓ Logged" : state === "saving" ? "Logging…" : state === "error" ? "Retry" : "✅ Ate this";

  return (
    <button
      onClick={logIt}
      disabled={state === "saving" || state === "done"}
      className={`chip border ${
        state === "done"
          ? "border-herb-600 bg-herb-100 text-herb-700"
          : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );
}
