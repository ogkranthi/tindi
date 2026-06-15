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

/** A person we plan and track for. */
export interface Member {
  id: MemberId;
  name: string;
  role: "adult" | "child";
  ageYears?: number;
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
