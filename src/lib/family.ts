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

// This household eats everyday Telugu/Andhra home food. Plans should use familiar
// home names (pappu, koora, vepudu, pulusu, charu, pachadi, tiffins) — not fancy
// or restaurant-style names — and vary the dish day to day.
export const FAMILY_CUISINES = ["Andhra-Telugu", "South Indian", "North Indian", "Continental"];

export const FAMILY_HEALTHY_FOODS = ["fish", "chicken", "mutton", "nuts", "seeds"];

/**
 * A vocabulary of familiar home dishes the model should draw from and ROTATE so
 * the week isn't the same pappu + koora every day. Grouped by meal role.
 */
export const FAMILY_HOME_DISHES = {
  tiffins: [
    "idli with sambar & chutney",
    "plain dosa / masala dosa",
    "pesarattu (green-gram dosa) with ginger chutney",
    "upma",
    "ravva pongal / ven pongal",
    "uttapam",
    "semiya (vermicelli) upma",
    "atukulu (poha)",
    "ragi dosa / ragi java",
    "mysore bajji / punugulu (occasional)",
    "chapati with a light curry",
  ],
  pappu: [
    "tomato pappu",
    "palakura pappu (spinach dal)",
    "thotakura pappu (amaranth dal)",
    "dosakaya pappu (cucumber dal)",
    "mamidikaya pappu (raw mango dal, seasonal)",
    "sorakaya pappu (bottle gourd dal)",
    "kandi pappu (plain toor dal) with ghee",
    "pappu charu",
  ],
  kooraVepudu: [
    "bendakaya vepudu (okra fry)",
    "beerakaya koora (ridge gourd)",
    "aloo (potato) fry",
    "cabbage koora",
    "dondakaya vepudu (tindora fry)",
    "vankaya koora (brinjal)",
    "gutti vankaya (stuffed brinjal)",
    "sorakaya koora (bottle gourd)",
    "carrot-beans koora",
    "chikkudukaya koora (broad beans)",
  ],
  nonVeg: [
    "chicken curry",
    "chicken pulusu",
    "fish pulusu",
    "fish fry (well-cooked)",
    "mutton curry (weekend)",
    "egg curry / egg pulusu",
  ],
  riceSides: [
    "rice with sambar",
    "rasam (charu) rice",
    "perugu annam (curd rice)",
    "pulihora (tamarind/lemon rice)",
    "bagara annam",
    "jeera rice",
    "roti / chapati",
    "millet (korralu/ragi) rice for low-GI meals",
  ],
  pachadiPodi: [
    "gongura pachadi",
    "tomato pachadi",
    "dosakaya pachadi",
    "idli podi with ghee/oil",
    "curry-leaf or coriander podi",
  ],
  snacks: [
    "seasonal fruit",
    "majjiga (spiced buttermilk)",
    "roasted chana / sprouts",
    "soaked nuts & seeds",
    "vegetable sundal",
    "ragi malt / millet snack",
  ],
};

