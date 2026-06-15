import { randomUUID } from "node:crypto";
import { chat, defaultModel, parseJsonObject } from "./openrouter";
import { FAMILY_CUISINES, FAMILY_HEALTHY_FOODS, FAMILY_HOME_DISHES } from "./family";
import { DAY_NAMES, addDays, weekStart } from "./dates";
import { CATEGORIES, type DayPlan, type Meal, type MealPlan, type Member } from "./types";

function dishVocabulary(): string {
  const d = FAMILY_HOME_DISHES;
  return [
    `Breakfast tiffins: ${d.tiffins.join("; ")}.`,
    `Pappu (dals) — rotate a DIFFERENT one each time: ${d.pappu.join("; ")}.`,
    `Koora/vepudu (veg) — rotate the vegetable: ${d.kooraVepudu.join("; ")}.`,
    `Non-veg: ${d.nonVeg.join("; ")}.`,
    `Rice & sides: ${d.riceSides.join("; ")}.`,
    `Pachadi/podi: ${d.pachadiPodi.join("; ")}.`,
    `Snacks: ${d.snacks.join("; ")}.`,
  ].join("\n");
}

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
    "You are Tindi, planning everyday home meals for a Telugu/Andhra family. Optimize for HEALTH first, then for being FAMILIAR and easy to cook, then variety.",
    "VERY IMPORTANT — style of dishes:",
    "- Use everyday South Indian / Andhra home cooking with FAMILIAR home names the family already knows (pappu, koora, vepudu, pulusu, charu, pachadi, idli, dosa, pesarattu, upma, curd rice).",
    "- Do NOT invent fancy, restaurant-style, fusion, or Western-gourmet dish names. If a name wouldn't be said in a Telugu home kitchen, don't use it.",
    "- A normal meal = rice or roti + a pappu (dal) + a koora/vepudu (veg) + optional pachadi/podi + curd; add a non-veg or egg dish a few times a week. Breakfast = South Indian tiffins. Keep curd rice / rasam rice in rotation.",
    "VARIETY rule: do NOT repeat the same dish across the week, and do NOT use the same pappu or the same koora vegetable two days in a row. Rotate through different dals and different vegetables each day.",
    "Familiar home dishes to draw from and rotate (pick varied items from each group across the week):",
    dishVocabulary(),
    "Hard rules you must never break:",
    "- Respect every member's 'avoid' list and medical context. Pregnancy and prediabetes safety override taste.",
    "- For the pregnant member: no high-mercury fish, no raw/undercooked meat or fish, no unpasteurized dairy; emphasize folate (palakura/thotakura greens), iron, calcium (dairy), omega-3, protein.",
    "- For the prediabetic/overweight member: low-glycemic — prefer millet/ragi/brown rice or smaller white-rice portions, more veg/dal/fiber, pair rice with protein; modest portions.",
    "- For the thyroid member: include selenium-rich foods (seeds, a brazil nut) and avoid large amounts of RAW goitrogenic vegetables (raw cabbage); cooked is fine.",
    "- For the toddler: small, mild (low-spice) versions of the same family food — e.g. soft rice with pappu & ghee, idli, banana; no whole nuts or choking-hazard shapes.",
    "Time-saving: cook ONCE for the whole family with simple per-person tweaks (mild portion for toddler, millet rice for mom), reuse vegetables across the week, keep weeknight prep realistic. Weekends can be more involved (Dad plays cricket Sat/Sun — heartier).",
    `Categorize each meal's contribution using ONLY these tags: ${CATEGORIES.join(", ")}.`,
    "Return STRICT JSON only — no prose, no markdown. Quantities must be concrete (numbers + units) so a grocery list can be built from them. Assign every ingredient an 'aisle' from: produce, meat & seafood, dairy & eggs, pantry, grains & bread, nuts & seeds, spices, frozen, other.",
    "Be concise to keep the response complete: keep 'description' to one short sentence, 'healthNotes' to one short clause, and list only the key shopping ingredients per meal. Give a realistic prepMinutes for a home cook.",
  ].join("\n");

  const schema = `{
  "familyNotes": "1-3 sentences on how this week serves the family's health goals",
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "slot": "breakfast|lunch|dinner|snack",
          "title": "familiar home dish name, e.g. Tomato pappu + rice",
          "cuisine": "${cuisines.join('|')}",
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
    maxTokens: 16000, // 7 days × ~5 meals with ingredients is a large response
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

  if (days.every((d) => d.meals.length === 0)) {
    throw new Error("The model returned no usable meals. Please try generating again.");
  }

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
