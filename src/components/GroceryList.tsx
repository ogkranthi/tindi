"use client";

import { useState } from "react";
import type { GroceryItem } from "@/lib/types";

const AISLE_ICON: Record<string, string> = {
  produce: "🥬",
  "meat & seafood": "🐟",
  "dairy & eggs": "🥚",
  "grains & bread": "🍞",
  "nuts & seeds": "🌰",
  pantry: "🫙",
  spices: "🌶️",
  frozen: "🧊",
  other: "🛒",
};

export default function GroceryList({
  mealPlanId,
  groups,
}: {
  mealPlanId: string;
  groups: { aisle: string; items: GroceryItem[] }[];
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of groups) for (const it of g.items) init[`${it.item}::${it.unit}`] = it.checked;
    return init;
  });

  async function toggle(item: GroceryItem) {
    const key = `${item.item}::${item.unit}`;
    const next = !checked[key];
    setChecked((c) => ({ ...c, [key]: next }));
    await fetch("/api/grocery/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealPlanId, item: item.item, unit: item.unit, checked: next }),
    }).catch(() => {});
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="text-sm text-stone-500">
        {done} / {total} items checked
      </div>
      {groups.map((g) => (
        <section key={g.aisle} className="card p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold capitalize text-stone-700">
            <span>{AISLE_ICON[g.aisle] ?? "🛒"}</span>
            {g.aisle}
          </h2>
          <ul className="divide-y divide-stone-100">
            {g.items.map((item) => {
              const key = `${item.item}::${item.unit}`;
              const isChecked = checked[key];
              return (
                <li key={key}>
                  <label className="flex cursor-pointer items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(item)}
                      className="h-4 w-4 rounded border-stone-300 text-herb-600 focus:ring-herb-500"
                    />
                    <span className={isChecked ? "text-stone-400 line-through" : "text-stone-800"}>
                      {item.item}
                    </span>
                    <span className="ml-auto text-sm text-stone-500">
                      {item.qty} {item.unit}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
