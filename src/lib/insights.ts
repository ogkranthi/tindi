import {
  getCachedInsights,
  getDistinctFoodsBefore,
  getLogsForWeek,
  saveInsights,
} from "./db";
import { addDays } from "./dates";
import { aggregateWeek } from "./nutrition";
import { chat, defaultModel, parseJsonObject } from "./openrouter";
import {
  EMPTY_NUTRIENTS,
  NUTRIENT_KEYS,
  type Member,
  type MemberInsights,
  type NutrientVector,
} from "./types";
import {
  NUTRIENT_META,
  pctOfTarget,
  trimesterFromDueDate,
  weeklyTargetsFor,
} from "./health/targets";

export interface NutrientStat {
  key: keyof NutrientVector;
  label: string;
  unit: string;
  direction: "up" | "down";
  value: number;
  target: number;
  pct: number;
}

export interface VarietyStat {
  distinctThisWeek: number;
  newThisWeek: string[];
}

export interface MemberNutrition {
  member: Member;
  weekStart: string;
  weekEnd: string;
  logCount: number;
  vector: NutrientVector;
  stats: NutrientStat[];
  variety: VarietyStat;
  trimester?: { trimester: 1 | 2 | 3; weeksPregnant: number };
  /** True if nutrient estimation couldn't run (e.g. missing API key). */
  nutritionUnavailable: boolean;
}

/** The numeric health picture for a member's week — no AI, safe to render always. */
export async function getMemberNutrition(
  member: Member,
  weekStart: string
): Promise<MemberNutrition> {
  const weekEnd = addDays(weekStart, 6);
  const logs = getLogsForWeek(member.id, weekStart, weekEnd);
  let vector: NutrientVector;
  let nutritionUnavailable = false;
  try {
    vector = await aggregateWeek(logs);
  } catch {
    // Missing key or model error — show category progress without micros.
    vector = { ...EMPTY_NUTRIENTS };
    nutritionUnavailable = logs.some((l) => l.food && l.food.trim());
  }
  const targets = weeklyTargetsFor(member);

  const stats: NutrientStat[] = NUTRIENT_KEYS.map((key) => ({
    key,
    label: NUTRIENT_META[key].label,
    unit: NUTRIENT_META[key].unit,
    direction: NUTRIENT_META[key].direction,
    value: Math.round(vector[key]),
    target: Math.round(targets[key]),
    pct: pctOfTarget(key, vector[key], targets[key]),
  }));

  const priorFoods = getDistinctFoodsBefore(member.id, weekStart);
  const thisWeekFoods = new Set(
    logs.filter((l) => l.food && l.food.trim()).map((l) => l.food!.trim().toLowerCase())
  );
  const newThisWeek = [...thisWeekFoods].filter((f) => !priorFoods.has(f));

  return {
    member,
    weekStart,
    weekEnd,
    logCount: logs.length,
    vector,
    stats,
    variety: { distinctThisWeek: thisWeekFoods.size, newThisWeek },
    trimester: member.pregnancyDueDate
      ? trimesterFromDueDate(member.pregnancyDueDate)
      : undefined,
    nutritionUnavailable,
  };
}

function focusFor(member: Member): string[] {
  const f: string[] = [];
  if (member.conditions.includes("pregnancy"))
    f.push("pregnancy nutrient adequacy (folate, iron, calcium, DHA, protein) and food safety");
  if (member.conditions.includes("prediabetes"))
    f.push("blood-sugar control (glycemic load, added sugar, fiber, protein pairing)");
  if (member.conditions.includes("overweight")) f.push("satiety and portion balance");
  if (member.conditions.includes("hypothyroid"))
    f.push("thyroid support (selenium, iodine; limit raw goitrogens)");
  if (member.conditions.includes("picky-eater"))
    f.push("food variety and repeat exposure to new foods");
  return f;
}

/**
 * AI read of the member's week + concrete recommendations. Cached per
 * (member, weekStart); pass `force` to recompute. `whoopContext` is reserved
 * for the Whoop phase.
 */
export async function buildMemberInsights(
  member: Member,
  weekStart: string,
  opts: { force?: boolean; whoopContext?: string } = {}
): Promise<MemberInsights> {
  if (!opts.force) {
    const cached = getCachedInsights(member.id, weekStart);
    if (cached) return cached;
  }

  const n = await getMemberNutrition(member, weekStart);
  const gaps = n.stats
    .map((s) => `${s.label}: ${s.value}/${s.target} ${s.unit} (${s.pct}% of target)`)
    .join("\n");

  const system =
    "You are Tindi, a careful family nutrition coach. Be specific, warm, and brief. " +
    "Give guidance grounded in the person's medical context. Pregnancy and prediabetes " +
    "safety override everything. Respond with STRICT JSON only.";

  const user = [
    `Member: ${member.name} (${member.role}${member.ageYears ? `, age ${member.ageYears}` : ""}).`,
    `Conditions: ${member.conditions.join(", ") || "none"}.`,
    n.trimester ? `Pregnancy: week ${n.trimester.weeksPregnant}, trimester ${n.trimester.trimester}.` : "",
    `Health notes: ${member.healthNotes.join(" | ")}`,
    `Focus areas: ${focusFor(member).join("; ") || "general wellbeing"}.`,
    "",
    `This week they logged ${n.logCount} items. Distinct foods: ${n.variety.distinctThisWeek}` +
      (n.variety.newThisWeek.length ? `, new foods tried: ${n.variety.newThisWeek.join(", ")}` : "") +
      ".",
    "Weekly nutrient totals vs target:",
    gaps,
    opts.whoopContext ? `\nWearable (Whoop) context:\n${opts.whoopContext}` : "",
    "",
    'Return JSON: { "summary": "2-3 sentence plain-language read of how the week is going for THEIR conditions", "recommendations": ["2-4 concrete, food-specific actions, each naming FAMILIAR everyday Telugu/Andhra/South-Indian home dishes (e.g. palakura pappu, ragi java, gongura pachadi, millet curd rice) — not fancy or Western names"] }',
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await chat({
    temperature: 0.5,
    json: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const parsed = parseJsonObject<{ summary?: string; recommendations?: string[] }>(raw);
  const insights: MemberInsights = {
    memberId: member.id,
    weekStart,
    summary: String(parsed.summary ?? ""),
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map(String).slice(0, 4)
      : [],
    createdAt: new Date().toISOString(),
    model: defaultModel(),
  };
  saveInsights(insights);
  return insights;
}
