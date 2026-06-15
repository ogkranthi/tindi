import { DEFAULT_WEEKLY_TARGETS, type Member } from "./types";

// The family Tindi plans for. Seeded on first run; editable later via the Family page.
// Health context here is what shapes every AI meal plan and recommendation.
export const SEED_FAMILY: Member[] = [
  {
    id: "dad",
    name: "Dad",
    role: "adult",
    conditions: ["hypothyroid"],
    healthNotes: [
      "Hypothyroid (thyroid condition) — favor selenium (brazil nuts, seeds), iodine-aware; limit large amounts of raw goitrogenic veg (raw kale, raw cabbage).",
      "Software developer — long sedentary stretches on weekdays.",
    ],
    likes: ["fish", "chicken", "mutton", "nuts", "seeds"],
    avoid: ["excess raw goitrogens"],
    activity: ["Plays cricket on weekends (higher energy + recovery needs Sat/Sun)"],
    wearable: "whoop",
    weeklyTargets: { ...DEFAULT_WEEKLY_TARGETS },
  },
  {
    id: "mom",
    name: "Mom",
    role: "adult",
    conditions: ["pregnancy", "prediabetes", "overweight"],
    // ~4 months along as of 2026-06-15 → due roughly mid-November 2026.
    pregnancyDueDate: "2026-11-15",
    healthNotes: [
      "Prediabetic — low-glycemic, controlled-carb meals; pair carbs with protein/fat/fiber.",
      "Overweight — portion-aware, satiating, high-fiber.",
      "Pregnant (~4 months) — needs folate, iron, calcium, omega-3 (DHA), protein; AVOID high-mercury fish (king mackerel, swordfish, shark), raw/undercooked fish & meat, unpasteurized dairy.",
      "Software developer — long sedentary stretches on weekdays.",
    ],
    likes: ["fish", "chicken", "mutton", "nuts", "seeds"],
    avoid: [
      "high-mercury fish",
      "raw/undercooked fish and meat",
      "unpasteurized cheese",
      "refined sugar spikes",
    ],
    activity: ["Walks sometimes", "Household chores"],
    wearable: "whoop",
    weeklyTargets: { ...DEFAULT_WEEKLY_TARGETS },
  },
  {
    id: "toddler",
    name: "Toddler",
    role: "child",
    ageYears: 3,
    conditions: ["picky-eater"],
    healthNotes: [
      "Picky eater, 3 years old — small portions, finger-friendly, mild spice, familiar shapes/textures.",
      "Use hidden-veggie techniques and repeat exposure to new foods.",
      "Choking-aware: cut grapes/round foods, avoid whole nuts (use nut butters / ground).",
    ],
    likes: ["mild flavors", "finger foods"],
    avoid: ["whole nuts", "very spicy food", "choking-hazard shapes"],
    activity: ["Active play"],
    wearable: "none",
    // Lighter targets for a toddler; still tracked for variety.
    weeklyTargets: { veggies: 5, fruits: 5, protein: 3, grains: 3, treats: 2 },
  },
];

export const FAMILY_CUISINES = ["Indian", "Mediterranean", "Mexican", "American"];

export const FAMILY_HEALTHY_FOODS = ["fish", "chicken", "mutton", "nuts", "seeds"];
