import { chat, parseJsonObject } from "./openrouter";
import { getCachedNutrition, putCachedNutrition } from "./db";
import {
  EMPTY_NUTRIENTS,
  NUTRIENT_KEYS,
  type FoodLog,
  type NutrientVector,
} from "./types";

function normalizeKey(food: string): string {
  return food.trim().toLowerCase().replace(/\s+/g, " ");
}

function coerce(raw: any): NutrientVector {
  const out = { ...EMPTY_NUTRIENTS };
  if (raw && typeof raw === "object") {
    for (const k of NUTRIENT_KEYS) {
      const v = Number(raw[k]);
      if (Number.isFinite(v) && v >= 0) out[k] = v;
    }
  }
  return out;
}

/**
 * Estimate the nutrient vector for one serving of a food via the model.
 * Cached by normalized food text so each distinct food is priced only once.
 */
export async function estimateNutrition(food: string): Promise<NutrientVector> {
  const key = normalizeKey(food);
  if (!key) return { ...EMPTY_NUTRIENTS };

  const cached = getCachedNutrition(key);
  if (cached) return coerce(JSON.parse(cached));

  const raw = await chat({
    temperature: 0,
    json: true,
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition database. Given a food/dish, return your best estimate of nutrients in ONE typical serving. Respond with STRICT JSON only.",
      },
      {
        role: "user",
        content: `Food: "${food}". Return JSON with numeric fields: calories (kcal), protein (g), fiber (g), sugar (g added/free sugars), folate (mcg), iron (mg), calcium (mg), omega3 (mg EPA+DHA+ALA), selenium (mcg), iodine (mcg), glycemicLoad (estimated glycemic load, unitless). Numbers only, no ranges.`,
      },
    ],
  });

  const vector = coerce(parseJsonObject(raw));
  putCachedNutrition(key, JSON.stringify(vector));
  return vector;
}

function addScaled(into: NutrientVector, v: NutrientVector, factor: number) {
  for (const k of NUTRIENT_KEYS) into[k] += v[k] * factor;
}

/**
 * Aggregate a week of a member's logs into a single nutrient vector.
 * Logs with a known `food` get a real estimate (scaled by servings); logs with
 * only a category contribute nothing to micros (they still count for targets).
 */
export async function aggregateWeek(logs: FoodLog[]): Promise<NutrientVector> {
  const total = { ...EMPTY_NUTRIENTS };
  const named = logs.filter((l) => l.food && l.food.trim());
  // De-dupe estimate calls across identical foods in the same week.
  const unique = [...new Set(named.map((l) => normalizeKey(l.food!)))];
  const byKey = new Map<string, NutrientVector>();
  await Promise.all(
    unique.map(async (k) => {
      byKey.set(k, await estimateNutrition(k));
    })
  );
  for (const l of named) {
    const v = byKey.get(normalizeKey(l.food!));
    if (v) addScaled(total, v, l.servings || 1);
  }
  return total;
}
