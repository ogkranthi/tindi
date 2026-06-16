// Core domain types for Tindi.

export type MemberId = string;

/** A weekly target expressed in servings, per the family's nutrition philosophy. */
export interface WeeklyTargets {
  veggies: number;
  fruits: number;
  protein: number;
  grains: number;
  treats: number;
}

export const DEFAULT_WEEKLY_TARGETS: WeeklyTargets = {
  veggies: 5,
  fruits: 4,
  protein: 3,
  grains: 2,
  treats: 1,
};

export type Category = keyof WeeklyTargets;

export const CATEGORIES: Category[] = ["veggies", "fruits", "protein", "grains", "treats"];

/** Structured health conditions that drive nutrient targets + insights logic. */
export type Condition =
  | "pregnancy"
  | "prediabetes"
  | "overweight"
  | "hypothyroid"
  | "picky-eater";

/** A person we plan and track for. */
export interface Member {
  id: MemberId;
  name: string;
  role: "adult" | "child";
  ageYears?: number;
  /** Machine-readable conditions that key nutrient targets + condition widgets. */
  conditions: Condition[];
  /** ISO date (yyyy-mm-dd) of the expected due date, when pregnant. Drives trimester. */
  pregnancyDueDate?: string;
  /** Free-text health context fed to the AI (conditions, pregnancy, etc.). */
  healthNotes: string[];
  /** Foods to favor. */
  likes: string[];
  /** Foods/ingredients to avoid or limit. */
  avoid: string[];
  /** Activity context (sport, walking, chores) for energy/recovery framing. */
  activity: string[];
  /** Wearable, if any — feeds the (future) insights view. */
  wearable?: "whoop" | "none";
  weeklyTargets: WeeklyTargets;
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface Ingredient {
  item: string;
  qty: string;
  unit: string;
  /** Grocery aisle for list grouping, e.g. "produce", "meat & seafood". */
  aisle: string;
}

export interface Meal {
  slot: MealSlot;
  title: string;
  cuisine: string;
  description: string;
  /** Which member ids this meal is portioned for. */
  forMembers: MemberId[];
  /** Coarse nutrition categories this meal contributes toward weekly targets. */
  categories: Category[];
  ingredients: Ingredient[];
  /** Ordered cooking steps — a short home-cook recipe for the dish. */
  steps: string[];
  /**
   * What to do ahead of time (typically the night before): soaking dals/legumes,
   * fermenting idli/dosa batter, marinating, thawing, setting curd. Empty when
   * nothing needs doing in advance.
   */
  prepAhead: string;
  /** Per-member or general health rationale, e.g. low-GI for mom, hidden veg for toddler. */
  healthNotes: string;
  prepMinutes: number;
  tags: string[];
}

export interface DayPlan {
  day: string; // e.g. "Monday"
  date: string; // ISO yyyy-mm-dd
  meals: Meal[];
}

export interface MealPlan {
  id: string;
  weekStart: string; // ISO yyyy-mm-dd (Monday)
  cuisines: string[];
  days: DayPlan[];
  familyNotes: string;
  createdAt: string;
  model: string;
}

export interface GroceryItem {
  item: string;
  qty: string;
  unit: string;
  aisle: string;
  checked: boolean;
}

export interface GroceryList {
  mealPlanId: string;
  weekStart: string;
  items: GroceryItem[];
}

// ---- Tracking & health intelligence ----

/** A single thing eaten by a member on a day. */
export interface FoodLog {
  id: number;
  memberId: MemberId;
  logDate: string; // ISO yyyy-mm-dd
  category: Category;
  servings: number;
  /** Specific food/meal name, when known (powers nutrition + variety). */
  food: string | null;
  /** Where the log came from. */
  source: "plan" | "manual";
  createdAt: string;
}

/** The nutrients Tindi reasons about. Macros + the micros our family cares about. */
export interface NutrientVector {
  calories: number;
  protein: number; // g
  fiber: number; // g
  sugar: number; // g
  folate: number; // mcg
  iron: number; // mg
  calcium: number; // mg
  omega3: number; // mg (DHA/EPA + ALA)
  selenium: number; // mcg
  iodine: number; // mcg
  /** Estimated glycemic load contribution (unitless). */
  glycemicLoad: number;
}

export const NUTRIENT_KEYS: (keyof NutrientVector)[] = [
  "calories",
  "protein",
  "fiber",
  "sugar",
  "folate",
  "iron",
  "calcium",
  "omega3",
  "selenium",
  "iodine",
  "glycemicLoad",
];

export const EMPTY_NUTRIENTS: NutrientVector = {
  calories: 0,
  protein: 0,
  fiber: 0,
  sugar: 0,
  folate: 0,
  iron: 0,
  calcium: 0,
  omega3: 0,
  selenium: 0,
  iodine: 0,
  glycemicLoad: 0,
};

export interface MemberInsights {
  memberId: MemberId;
  weekStart: string;
  summary: string;
  recommendations: string[];
  createdAt: string;
  model: string;
}

// ---- Notes ----

/** A shared family note: reminders, lists, anything worth keeping. */
export interface Note {
  id: string;
  title: string;
  body: string;
  /** Optional author/owner among the family. */
  memberId?: MemberId;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Finances ----

export type TransactionType = "expense" | "income";

export const FINANCE_CATEGORIES = [
  "groceries",
  "dining",
  "utilities",
  "rent",
  "childcare",
  "health",
  "transport",
  "shopping",
  "education",
  "subscriptions",
  "savings",
  "income",
  "other",
] as const;

export type FinanceCategory = (typeof FINANCE_CATEGORIES)[number];

/** A single household money movement (expense or income), amounts in INR. */
export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  /** Positive amount in INR; direction is given by `type`. */
  amount: number;
  type: TransactionType;
  category: FinanceCategory;
  /** Which family member paid / earned, when known. */
  paidBy?: MemberId;
  createdAt: string;
}
