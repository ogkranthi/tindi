import { randomUUID } from "node:crypto";
import { chat, defaultModel, parseJsonObject } from "./openrouter";
import { FAMILY_CUISINES, FAMILY_HEALTHY_FOODS } from "./family";
import { DAY_NAMES, addDays, weekStart } from "./dates";
import { CATEGORIES, type DayPlan, type Meal, type MealPlan, type Member } from "./types";

export interface GenerateOptions {
  members: Member[];
  cuisines?: string[];
  /** Free-text steer from the user, e.g. "lots of leftovers, dad travels Wed". */
  notes?: string;
  weekStartDate?: string;
}

function memberBrief(m: Member): string {
  const lines = [
    `- ${m.name} (${m.role}${m.ageYears ? `, age ${m.ageYears}` : ""}${m.wearable && m.wearable !== "none" ? `, wears ${m.wearable}` : ""}):`,
    ...m.healthNotes.map((n) => `    health: ${n}`),
    m.likes.length ? `    likes: ${m.likes.join(", ")}` : "",
    m.avoid.length ? `    avoid: ${m.avoid.join(", ")}` : "",
    m.activity.length ? `    activity: ${m.activity.join("; ")}` : "",
    `    weekly target servings — veg ${m.weeklyTargets.veggies}, fruit ${m.weeklyTargets.fruits}, protein ${m.weeklyTargets.protein}, grains ${m.weeklyTargets.grains}, treats ${m.weeklyTargets.treats}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function buildPrompt(opts: GenerateOptions): { system: string; user: string } {
  const cuisines = opts.cuisines?.length ? opts.cuisines : FAMILY_CUISINES;

  const system = [
    "You are Tindi, a careful family nutritionist + meal planner.",
    "You design a 7-day dinner-forward weekly meal plan for one household, optimizing for HEALTH first, then time-saving, then variety and enjoyment.",
    "Hard rules you must never break:",
    "- Respect every member's 'avoid' list and medical context. Pregnancy and prediabetes safety override taste.",
    "- For the pregnant member: no high-mercury fish, no raw/undercooked meat or fish, no unpasteurized dairy; emphasize folate, iron, calcium, omega-3, protein.",
    "- For the prediabetic/overweight member: low-glycemic, fiber- and protein-forward, pair carbs with protein/fat, modest portions.",
    "- For the thyroid member: include selenium-rich foods (e.g. seeds, brazil nuts) and avoid large amounts of RAW goitrogenic vegetables.",
    "- For a toddler: small, finger-friendly, mild portions; no whole nuts or choking-hazard shapes.",
    "Time-saving: prefer meals that cook once and serve the whole family (with simple per-person tweaks), reuse ingredients across the week, and keep most weeknight prep under 35 minutes. Weekends can be more involved (note when one parent has higher activity, e.g. cricket).",
    `Cuisines to draw from: ${cuisines.join(", ")}. Lean on the household's healthy staples: ${FAMILY_HEALTHY_FOODS.join(", ")}.`,
    `Categorize each meal's contribution using ONLY these tags: ${CATEGORIES.join(", ")}.`,
    "Return STRICT JSON only — no prose, no markdown. Quantities must be concrete (numbers + units) so a grocery list can be built from them. Assign every ingredient an 'aisle' from: produce, meat & seafood, dairy & eggs, pantry, grains & bread, nuts & seeds, spices, frozen, other.",
  ].join("\n");

  const schema = `{
  "familyNotes": "1-3 sentences on how this week serves the family's health goals",
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "slot": "breakfast|lunch|dinner|snack",
          "title": "string",
          "cuisine": "Indian|Mediterranean|Mexican|American",
          "description": "1-2 sentences",
          "forMembers": ["dad","mom","toddler"],
          "categories": ["veggies","protein", ...],
          "prepMinutes": 25,
          "tags": ["low-GI","high-protein","leftover-friendly", ...],
          "healthNotes": "why this fits the family (call out per-person tweaks)",
          "ingredients": [
            { "item": "salmon fillet", "qty": "500", "unit": "g", "aisle": "meat & seafood" }
          ]
        }
      ]
    }
  ]
}`;

  const user = [
    "Plan the upcoming week for this household.",
    "",
    "FAMILY:",
    opts.members.map(memberBrief).join("\n"),
    "",
    opts.notes ? `EXTRA CONTEXT FROM USER: ${opts.notes}` : "",
    "",
    "Provide breakfast, lunch, dinner for all 7 days, plus 1-2 healthy snacks/day. Make portions and small per-person adjustments explicit in healthNotes.",
    "",
    `Respond with JSON matching exactly this shape (member ids are: ${opts.members.map((m) => m.id).join(", ")}):`,
    schema,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

const SLOTS = new Set(["breakfast", "lunch", "dinner", "snack"]);
const VALID_CATEGORIES = new Set<string>(CATEGORIES);

function normalizeMeal(raw: any, memberIds: string[]): Meal | null {
  if (!raw || typeof raw.title !== "string") return null;
  const slot = SLOTS.has(raw.slot) ? raw.slot : "dinner";
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients
        .filter((i: any) => i && typeof i.item === "string")
        .map((i: any) => ({
          item: String(i.item),
          qty: String(i.qty ?? ""),
          unit: String(i.unit ?? ""),
          aisle: String(i.aisle ?? "other").toLowerCase(),
        }))
    : [];
  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter((c: any) => VALID_CATEGORIES.has(c))
    : [];
  const forMembers = Array.isArray(raw.forMembers)
    ? raw.forMembers.filter((id: any) => memberIds.includes(id))
    : memberIds;
  return {
    slot,
    title: String(raw.title),
    cuisine: String(raw.cuisine ?? ""),
    description: String(raw.description ?? ""),
    forMembers: forMembers.length ? forMembers : memberIds,
    categories,
    ingredients,
    healthNotes: String(raw.healthNotes ?? ""),
    prepMinutes: Number.isFinite(raw.prepMinutes) ? Number(raw.prepMinutes) : 0,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  };
}

export async function generateMealPlan(opts: GenerateOptions): Promise<MealPlan> {
  const start = opts.weekStartDate || weekStart();
  const memberIds = opts.members.map((m) => m.id);
  const { system, user } = buildPrompt(opts);

  const raw = await chat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    json: true,
    temperature: 0.7,
  });

  const parsed = parseJsonObject<{ familyNotes?: string; days?: any[] }>(raw);
  const daysIn = Array.isArray(parsed.days) ? parsed.days : [];

  const days: DayPlan[] = DAY_NAMES.map((name, idx) => {
    const match = daysIn.find((d) => typeof d?.day === "string" && d.day.toLowerCase().startsWith(name.toLowerCase().slice(0, 3)));
    const mealsRaw = Array.isArray(match?.meals) ? match.meals : [];
    const meals = mealsRaw
      .map((m: any) => normalizeMeal(m, memberIds))
      .filter((m: Meal | null): m is Meal => m !== null);
    return { day: name, date: addDays(start, idx), meals };
  });

  return {
    id: randomUUID(),
    weekStart: start,
    cuisines: opts.cuisines?.length ? opts.cuisines : FAMILY_CUISINES,
    days,
    familyNotes: String(parsed.familyNotes ?? ""),
    createdAt: new Date().toISOString(),
    model: defaultModel(),
  };
}
