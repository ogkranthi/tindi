import type { Member, NutrientVector } from "../types";

// Per-nutrient display metadata. `direction` says whether more is better ("up")
// or it's a ceiling to stay under ("down", e.g. sugar / glycemic load).
export type Direction = "up" | "down";

export const NUTRIENT_META: Record<
  keyof NutrientVector,
  { label: string; unit: string; direction: Direction }
> = {
  calories: { label: "Calories", unit: "kcal", direction: "up" },
  protein: { label: "Protein", unit: "g", direction: "up" },
  fiber: { label: "Fiber", unit: "g", direction: "up" },
  sugar: { label: "Added sugar", unit: "g", direction: "down" },
  folate: { label: "Folate", unit: "mcg", direction: "up" },
  iron: { label: "Iron", unit: "mg", direction: "up" },
  calcium: { label: "Calcium", unit: "mg", direction: "up" },
  omega3: { label: "Omega-3 (DHA)", unit: "mg", direction: "up" },
  selenium: { label: "Selenium", unit: "mcg", direction: "up" },
  iodine: { label: "Iodine", unit: "mcg", direction: "up" },
  glycemicLoad: { label: "Glycemic load", unit: "GL", direction: "down" },
};

/**
 * Which nutrients matter most for a member, given role + conditions. The core
 * "is this enough food?" signals (calories, protein, fiber) apply to everyone;
 * conditions add their key micros, and children add growth nutrients.
 */
export function relevantNutrients(member: Member): (keyof NutrientVector)[] {
  const keys = new Set<keyof NutrientVector>(["calories", "protein", "fiber"]);
  if (member.role === "child")
    (["iron", "calcium"] as (keyof NutrientVector)[]).forEach((k) => keys.add(k)); // growth
  if (member.conditions.includes("pregnancy"))
    (["folate", "iron", "calcium", "omega3"] as (keyof NutrientVector)[]).forEach((k) => keys.add(k));
  if (member.conditions.includes("prediabetes"))
    (["glycemicLoad", "sugar"] as (keyof NutrientVector)[]).forEach((k) => keys.add(k)); // ceilings
  if (member.conditions.includes("hypothyroid"))
    (["selenium", "iodine"] as (keyof NutrientVector)[]).forEach((k) => keys.add(k));
  return [...keys];
}

/** Gestational status derived from an expected due date. */
export function trimesterFromDueDate(
  dueDate: string,
  now: Date = new Date()
): { trimester: 1 | 2 | 3; weeksPregnant: number } {
  const due = new Date(dueDate + "T00:00:00");
  const msUntilDue = due.getTime() - now.getTime();
  const daysUntilDue = msUntilDue / 86_400_000;
  const daysPregnant = 280 - daysUntilDue; // 40-week gestation
  const weeksPregnant = Math.max(0, Math.min(42, Math.round(daysPregnant / 7)));
  const trimester = weeksPregnant < 14 ? 1 : weeksPregnant < 28 ? 2 : 3;
  return { trimester, weeksPregnant };
}

// Daily reference intakes for a typical adult; conditions adjust from here.
const ADULT_DAILY: NutrientVector = {
  calories: 2000,
  protein: 50,
  fiber: 28,
  sugar: 36, // ceiling
  folate: 400,
  iron: 12,
  calcium: 1000,
  omega3: 350,
  selenium: 55,
  iodine: 150,
  glycemicLoad: 100, // ceiling
};

// A 3-year-old needs far less.
const TODDLER_DAILY: NutrientVector = {
  calories: 1200,
  protein: 16,
  fiber: 19,
  sugar: 20,
  folate: 150,
  iron: 7,
  calcium: 700,
  omega3: 150,
  selenium: 20,
  iodine: 90,
  glycemicLoad: 60,
};

/** Daily nutrient targets for a member, adjusted for their conditions + trimester. */
export function dailyTargetsFor(member: Member, now: Date = new Date()): NutrientVector {
  const base: NutrientVector =
    member.role === "child" ? { ...TODDLER_DAILY } : { ...ADULT_DAILY };

  // Adult women baseline iron is higher than the generic default.
  if (member.role === "adult") base.iron = 18;

  if (member.conditions.includes("pregnancy")) {
    const { trimester } = member.pregnancyDueDate
      ? trimesterFromDueDate(member.pregnancyDueDate, now)
      : { trimester: 2 as const };
    base.calories += trimester === 1 ? 0 : trimester === 2 ? 340 : 450;
    base.protein = 71;
    base.folate = 600;
    base.iron = 27;
    base.calcium = 1000;
    base.omega3 = 500; // DHA emphasis
    base.iodine = 220;
    base.selenium = 60;
  }

  if (member.conditions.includes("prediabetes")) {
    base.sugar = 25; // tighter ceiling
    base.glycemicLoad = 80;
    base.fiber = Math.max(base.fiber, 35); // fiber blunts glucose response
  }

  if (member.conditions.includes("hypothyroid")) {
    base.selenium = Math.max(base.selenium, 70); // supports thyroid conversion
    base.iodine = Math.max(base.iodine, 150);
  }

  return base;
}

/** Weekly targets = daily × 7 (logs are aggregated per week). */
export function weeklyTargetsFor(member: Member, now: Date = new Date()): NutrientVector {
  const daily = dailyTargetsFor(member, now);
  const weekly = {} as NutrientVector;
  (Object.keys(daily) as (keyof NutrientVector)[]).forEach((k) => {
    weekly[k] = daily[k] * 7;
  });
  return weekly;
}

/**
 * Percent of target met (0–100+). For "down" nutrients we invert so that
 * staying under the ceiling reads as a healthy high percentage.
 */
export function pctOfTarget(key: keyof NutrientVector, value: number, target: number): number {
  if (target <= 0) return 0;
  const dir = NUTRIENT_META[key].direction;
  if (dir === "up") return Math.round((value / target) * 100);
  // ceiling: 100% when at/below target, dropping as you exceed it.
  return Math.round(Math.max(0, Math.min(1, (2 - value / target)) ) * 100);
}
