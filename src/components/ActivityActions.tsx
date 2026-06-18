"use client";

import { useState } from "react";
import type { ToddlerActivity } from "@/lib/types";

// "We did this!" + favorite toggles for one activity. Optimistic, persisted via
// /api/toddler-plan/mark; mirrors AteThisButton.
export default function ActivityActions({
  planId,
  activity,
  initialDone,
  initialFavorite,
}: {
  planId: string;
  activity: ToddlerActivity;
  initialDone: boolean;
  initialFavorite: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [favorite, setFavorite] = useState(initialFavorite);
  const [busy, setBusy] = useState<null | "done" | "favorite">(null);

  async function toggle(field: "done" | "favorite", next: boolean) {
    if (busy) return;
    setBusy(field);
    // Optimistic.
    if (field === "done") setDone(next);
    else setFavorite(next);
    try {
      const res = await fetch("/api/toddler-plan/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, activityId: activity.id, field, value: next, activity }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure.
      if (field === "done") setDone(!next);
      else setFavorite(!next);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => toggle("done", !done)}
        disabled={busy === "done"}
        className={`chip border ${
          done
            ? "border-herb-600 bg-herb-100 text-herb-700"
            : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
        }`}
      >
        {done ? "✓ We did this!" : "🎉 We did this!"}
      </button>
      <button
        onClick={() => toggle("favorite", !favorite)}
        disabled={busy === "favorite"}
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        className={`chip border ${
          favorite
            ? "border-amber-500 bg-amber-100 text-amber-700"
            : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
        }`}
      >
        {favorite ? "★ Favorite" : "☆ Favorite"}
      </button>
    </div>
  );
}
