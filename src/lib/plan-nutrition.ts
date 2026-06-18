import { estimateNutrition, normalizeKey } from "./nutrition";
import {
  NUTRIENT_META,
  pctOfTarget,
  relevantNutrients,
  weeklyTargetsFor,
} from "./health/targets";
import type { NutrientStat } from "./insights";
import {
  EMPTY_NUTRIENTS,
  NUTRIENT_KEYS,
  type MealPlan,
  type Member,
  type NutrientVector,
} from "./types";

// An "up" nutrient below this % of the weekly target is flagged as a shortfall.
const SHORT_PCT = 80;
// A "down" ceiling (sugar / glycemic load) below this inverted % is a "watch".
const CEILING_PCT = 60;

/** Per-person verdict on whether the planned week covers their needs. */
export interface MemberPlanSufficiency {
  memberId: string;
  name: string;
  role: Member["role"];
  /** Pregnancy chip context, when applicable. */
  pregnant: boolean;
  /** Number of meals in the plan portioned for this member. */
  mealCount: number;
  /** Relevant nutrients: planned weekly value vs weekly target. */
  stats: NutrientStat[];
  /** "Up" nutrients below target — the at-risk ones to show in red. */
  shortfalls: { label: string; pct: number }[];
  /** "Down" ceilings the plan trends over (e.g. sugar) — a caution, not a gap. */
  watch: { label: string; pct: number }[];
  status: "on-track" | "short" | "no-meals";
  /** Familiar foods to add to close each gap. */
  fixes: string[];
}

// Familiar Andhra/Telugu/South-Indian foods that boost each nutrient, keyed by
// the nutrient that's short. Phrased to match the meal-plan vocabulary.
const NUTRIENT_FIXES: Partial<Record<keyof NutrientVector, string>> = {
  calories: "a little ghee on rice, banana, or ragi java for steady energy",
  protein: "an extra serving of pappu (dal), egg, paneer, chicken, or curd",
  fiber: "millets, more veg, and whole dals in place of polished rice",
  folate: "palakura/thotakura greens and dal a few more times this week",
  iron: "thotakura, greens, dates, jaggery, or egg (pair with lemon for absorption)",
  calcium: "milk/curd, ragi (ragi java or sangati), and sesame (nuvvulu)",
  omega3: "small fish like rohu (pregnancy-safe), walnuts, or flax (avise ginjalu)",
  selenium: "a brazil nut, eggs, or seeds for thyroid support",
  iodine: "iodized salt, curd, and egg",
  sugar: "smaller white-rice portions and fewer sweets — swap to millet/brown rice",
  glycemicLoad: "smaller rice portions, more dal & veg, swap to millet/brown rice",
};

/**
 * Forecast a member's weekly nutrient intake from the meal plan: one serving of
 * each meal portioned for them. De-dupes estimate calls like `aggregateWeek`.
 */
export async function planNutritionForMember(
  plan: MealPlan,
  member: Member
): Promise<{ vector: NutrientVector; mealCount: number }> {
  const meals = plan.days
    .flatMap((d) => d.meals)
    .filter((m) => m.forMembers.includes(member.id) && m.title.trim());

  const total = { ...EMPTY_NUTRIENTS };
  if (meals.length === 0) return { vector: total, mealCount: 0 };

  const unique = [...new Set(meals.map((m) => normalizeKey(m.title)))];
  const byKey = new Map<string, NutrientVector>();
  await Promise.all(
    unique.map(async (k) => {
      byKey.set(k, await estimateNutrition(k));
    })
  );

  for (const m of meals) {
    const v = byKey.get(normalizeKey(m.title));
    if (v) for (const k of NUTRIENT_KEYS) total[k] += v[k];
  }
  return { vector: total, mealCount: meals.length };
}

/** Score the plan against one member's condition-aware weekly needs. */
export async function buildPlanSufficiency(
  plan: MealPlan,
  member: Member
): Promise<MemberPlanSufficiency> {
  const { vector, mealCount } = await planNutritionForMember(plan, member);
  const pregnant = member.conditions.includes("pregnancy");

  if (mealCount === 0) {
    return {
      memberId: member.id,
      name: member.name,
      role: member.role,
      pregnant,
      mealCount: 0,
      stats: [],
      shortfalls: [],
      watch: [],
      status: "no-meals",
      fixes: [],
    };
  }

  const targets = weeklyTargetsFor(member);
  const keys = relevantNutrients(member);
  const stats: NutrientStat[] = keys.map((key) => ({
    key,
    label: NUTRIENT_META[key].label,
    unit: NUTRIENT_META[key].unit,
    direction: NUTRIENT_META[key].direction,
    value: Math.round(vector[key]),
    target: Math.round(targets[key]),
    pct: pctOfTarget(key, vector[key], targets[key]),
  }));

  const shortfalls = stats
    .filter((s) => s.direction === "up" && s.pct < SHORT_PCT)
    .map((s) => ({ label: s.label, pct: s.pct }));
  const watch = stats
    .filter((s) => s.direction === "down" && s.pct < CEILING_PCT)
    .map((s) => ({ label: s.label, pct: s.pct }));

  const fixKeys = stats
    .filter((s) => (s.direction === "up" ? s.pct < SHORT_PCT : s.pct < CEILING_PCT))
    .map((s) => s.key);
  const fixes = [...new Set(fixKeys.map((k) => NUTRIENT_FIXES[k]).filter(Boolean) as string[])];

  return {
    memberId: member.id,
    name: member.name,
    role: member.role,
    pregnant,
    mealCount,
    stats,
    shortfalls,
    watch,
    status: shortfalls.length > 0 ? "short" : "on-track",
    fixes,
  };
}

/** Sufficiency verdicts for every member, computed in parallel. */
export async function buildPlanSufficiencyAll(
  plan: MealPlan,
  members: Member[]
): Promise<MemberPlanSufficiency[]> {
  return Promise.all(members.map((m) => buildPlanSufficiency(plan, m)));
}
