import type { GroceryItem, GroceryList, MealPlan } from "./types";

const AISLE_ORDER = [
  "produce",
  "meat & seafood",
  "dairy & eggs",
  "grains & bread",
  "nuts & seeds",
  "pantry",
  "spices",
  "frozen",
  "other",
];

function key(item: string, unit: string): string {
  return `${item.trim().toLowerCase()}::${unit.trim().toLowerCase()}`;
}

/**
 * Aggregate all ingredients in a meal plan into a deduplicated grocery list.
 * Quantities with the same numeric unit are summed; otherwise they're listed
 * together so nothing is silently lost.
 */
export function buildGroceryList(plan: MealPlan): GroceryList {
  const map = new Map<string, GroceryItem & { _parts: string[] }>();

  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients) {
        const k = key(ing.item, ing.unit);
        const existing = map.get(k);
        const num = parseFloat(ing.qty);
        if (existing) {
          const prev = parseFloat(existing.qty);
          if (Number.isFinite(prev) && Number.isFinite(num)) {
            existing.qty = String(round(prev + num));
          } else {
            existing._parts.push(ing.qty);
            existing.qty = existing._parts.filter(Boolean).join(" + ");
          }
        } else {
          map.set(k, {
            item: ing.item,
            qty: ing.qty,
            unit: ing.unit,
            aisle: ing.aisle || "other",
            checked: false,
            _parts: [ing.qty],
          });
        }
      }
    }
  }

  const items: GroceryItem[] = [...map.values()]
    .map(({ _parts, ...rest }) => rest)
    .sort((a, b) => {
      const ai = AISLE_ORDER.indexOf(a.aisle);
      const bi = AISLE_ORDER.indexOf(b.aisle);
      const ao = ai === -1 ? AISLE_ORDER.length : ai;
      const bo = bi === -1 ? AISLE_ORDER.length : bi;
      if (ao !== bo) return ao - bo;
      return a.item.localeCompare(b.item);
    });

  return { mealPlanId: plan.id, weekStart: plan.weekStart, items };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function groupByAisle(list: GroceryList): { aisle: string; items: GroceryItem[] }[] {
  const groups = new Map<string, GroceryItem[]>();
  for (const item of list.items) {
    const arr = groups.get(item.aisle) ?? [];
    arr.push(item);
    groups.set(item.aisle, arr);
  }
  return [...groups.entries()]
    .sort((a, b) => {
      const ai = AISLE_ORDER.indexOf(a[0]);
      const bi = AISLE_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([aisle, items]) => ({ aisle, items }));
}
