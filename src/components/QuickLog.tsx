"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, type Category } from "@/lib/types";

export default function QuickLog({
  memberId,
  date,
}: {
  memberId: string;
  date: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("veggies");
  const [food, setFood] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    setSaving(true);
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, category, food, source: "manual", logDate: date }),
      });
      setFood("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as Category)}
        className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        value={food}
        onChange={(e) => setFood(e.target.value)}
        placeholder="what did they eat? (optional)"
        className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-herb-500 focus:outline-none"
      />
      <button onClick={add} disabled={saving} className="btn-ghost">
        {saving ? "…" : "+ Log"}
      </button>
    </div>
  );
}
