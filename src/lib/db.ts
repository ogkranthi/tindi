import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SEED_FAMILY } from "./family";
import type {
  FoodLog,
  GroceryList,
  MealPlan,
  Member,
  MemberInsights,
  Note,
  Transaction,
} from "./types";

// Single shared connection. Next.js can re-import modules during dev (HMR),
// so we cache the instance on globalThis to avoid reopening the file.
const DB_PATH = process.env.TINDI_DB_PATH || path.join(process.cwd(), "data", "tindi.db");

declare global {
  // eslint-disable-next-line no-var
  var __tindiDb: Database.Database | undefined;
}

function open(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  seed(db);
  backfillMembers(db);
  return db;
}

// Members persisted before structured health fields existed get them backfilled
// from the seed (without disturbing any user edits to other fields).
function backfillMembers(db: Database.Database) {
  const rows = db.prepare("SELECT id, data FROM members").all() as { id: string; data: string }[];
  const update = db.prepare("UPDATE members SET data = ? WHERE id = ?");
  const tx = db.transaction(() => {
    for (const row of rows) {
      const m = JSON.parse(row.data) as Partial<Member>;
      if (Array.isArray(m.conditions)) continue;
      const seed = SEED_FAMILY.find((s) => s.id === row.id);
      m.conditions = seed?.conditions ?? [];
      if (seed?.pregnancyDueDate && !m.pregnancyDueDate) m.pregnancyDueDate = seed.pregnancyDueDate;
      update.run(JSON.stringify(m), row.id);
    }
  });
  tx();
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_meal_plans_week ON meal_plans(week_start);

    CREATE TABLE IF NOT EXISTS grocery_lists (
      meal_plan_id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE
    );

    -- Daily food tracking — powers nutrition aggregation, variety, streaks.
    CREATE TABLE IF NOT EXISTS food_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT NOT NULL,
      log_date TEXT NOT NULL,
      category TEXT NOT NULL,
      servings REAL NOT NULL DEFAULT 1,
      note TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_food_logs_member_date ON food_logs(member_id, log_date);

    -- Cache of AI nutrient estimates, keyed by normalized food text (price each food once).
    CREATE TABLE IF NOT EXISTS nutrition_cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Cached weekly AI insights per member.
    CREATE TABLE IF NOT EXISTS insights (
      member_id TEXT NOT NULL,
      week_start TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (member_id, week_start)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Shared family notes. Pinned + updated_at drive ordering.
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);

    -- Household money movements. Columns mirror the JSON for cheap filtering/sums.
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  `);

  // Additive columns on food_logs (SQLite lacks ADD COLUMN IF NOT EXISTS).
  addColumnIfMissing(db, "food_logs", "food", "TEXT");
  addColumnIfMissing(db, "food_logs", "source", "TEXT NOT NULL DEFAULT 'manual'");
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  decl: string
) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
  }
}

function seed(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) AS n FROM members").get() as { n: number }).n;
  if (count > 0) return;
  const insert = db.prepare("INSERT INTO members (id, data) VALUES (?, ?)");
  const tx = db.transaction((members: Member[]) => {
    for (const m of members) insert.run(m.id, JSON.stringify(m));
  });
  tx(SEED_FAMILY);
}

export function getDb(): Database.Database {
  if (!global.__tindiDb) global.__tindiDb = open();
  return global.__tindiDb;
}

// ---- Members ----

export function listMembers(): Member[] {
  const rows = getDb().prepare("SELECT data FROM members").all() as { data: string }[];
  return rows.map((r) => {
    const m = JSON.parse(r.data) as Member;
    if (!Array.isArray(m.conditions)) m.conditions = []; // defensive for legacy rows
    return m;
  });
}

export function saveMember(member: Member): void {
  getDb()
    .prepare(
      "INSERT INTO members (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
    )
    .run(member.id, JSON.stringify(member));
}

// ---- Meal plans ----

// Plans saved before recipe steps / make-ahead prep existed lack those fields.
// Backfill safe defaults on read so the UI can rely on them.
function hydrateMealPlan(plan: MealPlan): MealPlan {
  for (const day of plan.days ?? []) {
    for (const meal of day.meals ?? []) {
      if (!Array.isArray(meal.steps)) meal.steps = [];
      if (typeof meal.prepAhead !== "string") meal.prepAhead = "";
    }
  }
  return plan;
}

export function saveMealPlan(plan: MealPlan): void {
  getDb()
    .prepare(
      `INSERT INTO meal_plans (id, week_start, data, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET week_start = excluded.week_start, data = excluded.data`
    )
    .run(plan.id, plan.weekStart, JSON.stringify(plan), plan.createdAt);
}

export function getMealPlan(id: string): MealPlan | null {
  const row = getDb().prepare("SELECT data FROM meal_plans WHERE id = ?").get(id) as
    | { data: string }
    | undefined;
  return row ? hydrateMealPlan(JSON.parse(row.data) as MealPlan) : null;
}

export function getLatestMealPlan(): MealPlan | null {
  const row = getDb()
    .prepare("SELECT data FROM meal_plans ORDER BY created_at DESC LIMIT 1")
    .get() as { data: string } | undefined;
  return row ? hydrateMealPlan(JSON.parse(row.data) as MealPlan) : null;
}

export function listMealPlans(): { id: string; weekStart: string; createdAt: string }[] {
  return getDb()
    .prepare("SELECT id, week_start AS weekStart, created_at AS createdAt FROM meal_plans ORDER BY created_at DESC")
    .all() as { id: string; weekStart: string; createdAt: string }[];
}

// ---- Grocery lists ----

export function saveGroceryList(list: GroceryList): void {
  getDb()
    .prepare(
      `INSERT INTO grocery_lists (meal_plan_id, week_start, data) VALUES (?, ?, ?)
       ON CONFLICT(meal_plan_id) DO UPDATE SET week_start = excluded.week_start, data = excluded.data`
    )
    .run(list.mealPlanId, list.weekStart, JSON.stringify(list));
}

export function getGroceryList(mealPlanId: string): GroceryList | null {
  const row = getDb()
    .prepare("SELECT data FROM grocery_lists WHERE meal_plan_id = ?")
    .get(mealPlanId) as { data: string } | undefined;
  return row ? (JSON.parse(row.data) as GroceryList) : null;
}

// ---- Food logs ----

export interface NewFoodLog {
  memberId: string;
  logDate: string;
  category: string;
  servings?: number;
  food?: string | null;
  source?: "plan" | "manual";
}

const ROW_TO_LOG = `id, member_id AS memberId, log_date AS logDate, category, servings,
  food, COALESCE(source, 'manual') AS source, created_at AS createdAt`;

export function insertFoodLog(entry: NewFoodLog): void {
  getDb()
    .prepare(
      `INSERT INTO food_logs (member_id, log_date, category, servings, food, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      entry.memberId,
      entry.logDate,
      entry.category,
      entry.servings ?? 1,
      entry.food ?? null,
      entry.source ?? "manual",
      new Date().toISOString()
    );
}

export function insertFoodLogs(entries: NewFoodLog[]): void {
  const tx = getDb().transaction((rows: NewFoodLog[]) => {
    for (const r of rows) insertFoodLog(r);
  });
  tx(entries);
}

export function getLogsForWeek(memberId: string, weekStart: string, weekEnd: string): FoodLog[] {
  return getDb()
    .prepare(
      `SELECT ${ROW_TO_LOG} FROM food_logs
       WHERE member_id = ? AND log_date >= ? AND log_date <= ?
       ORDER BY log_date, id`
    )
    .all(memberId, weekStart, weekEnd) as FoodLog[];
}

export function getLogsForDate(memberId: string, date: string): FoodLog[] {
  return getDb()
    .prepare(`SELECT ${ROW_TO_LOG} FROM food_logs WHERE member_id = ? AND log_date = ? ORDER BY id`)
    .all(memberId, date) as FoodLog[];
}

/** Distinct (lowercased) food names logged for a member strictly before `date`. */
export function getDistinctFoodsBefore(memberId: string, date: string): Set<string> {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT LOWER(TRIM(food)) AS food FROM food_logs
       WHERE member_id = ? AND log_date < ? AND food IS NOT NULL AND TRIM(food) <> ''`
    )
    .all(memberId, date) as { food: string }[];
  return new Set(rows.map((r) => r.food));
}

// ---- Nutrition cache ----

export function getCachedNutrition(key: string): string | null {
  const row = getDb().prepare("SELECT data FROM nutrition_cache WHERE key = ?").get(key) as
    | { data: string }
    | undefined;
  return row ? row.data : null;
}

export function putCachedNutrition(key: string, data: string): void {
  getDb()
    .prepare(
      `INSERT INTO nutrition_cache (key, data, created_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET data = excluded.data`
    )
    .run(key, data, new Date().toISOString());
}

// ---- Insights ----

export function getCachedInsights(memberId: string, weekStart: string): MemberInsights | null {
  const row = getDb()
    .prepare("SELECT data FROM insights WHERE member_id = ? AND week_start = ?")
    .get(memberId, weekStart) as { data: string } | undefined;
  return row ? (JSON.parse(row.data) as MemberInsights) : null;
}

export function saveInsights(insights: MemberInsights): void {
  getDb()
    .prepare(
      `INSERT INTO insights (member_id, week_start, data, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(member_id, week_start) DO UPDATE SET data = excluded.data, created_at = excluded.created_at`
    )
    .run(insights.memberId, insights.weekStart, JSON.stringify(insights), insights.createdAt);
}

// ---- Notes ----

export function listNotes(): Note[] {
  const rows = getDb()
    .prepare("SELECT data FROM notes ORDER BY pinned DESC, updated_at DESC")
    .all() as { data: string }[];
  return rows.map((r) => JSON.parse(r.data) as Note);
}

export function getNote(id: string): Note | null {
  const row = getDb().prepare("SELECT data FROM notes WHERE id = ?").get(id) as
    | { data: string }
    | undefined;
  return row ? (JSON.parse(row.data) as Note) : null;
}

export function saveNote(note: Note): void {
  getDb()
    .prepare(
      `INSERT INTO notes (id, data, pinned, updated_at, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, pinned = excluded.pinned, updated_at = excluded.updated_at`
    )
    .run(note.id, JSON.stringify(note), note.pinned ? 1 : 0, note.updatedAt, note.createdAt);
}

export function deleteNote(id: string): void {
  getDb().prepare("DELETE FROM notes WHERE id = ?").run(id);
}

// ---- Transactions ----

export function listTransactions(fromDate?: string, toDate?: string): Transaction[] {
  const conds: string[] = [];
  const args: string[] = [];
  if (fromDate) {
    conds.push("date >= ?");
    args.push(fromDate);
  }
  if (toDate) {
    conds.push("date <= ?");
    args.push(toDate);
  }
  const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(`SELECT data FROM transactions${where} ORDER BY date DESC, created_at DESC`)
    .all(...args) as { data: string }[];
  return rows.map((r) => JSON.parse(r.data) as Transaction);
}

export function saveTransaction(t: Transaction): void {
  getDb()
    .prepare(
      `INSERT INTO transactions (id, date, type, category, amount, data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET date = excluded.date, type = excluded.type,
         category = excluded.category, amount = excluded.amount, data = excluded.data`
    )
    .run(t.id, t.date, t.type, t.category, t.amount, JSON.stringify(t), t.createdAt);
}

export function deleteTransaction(id: string): void {
  getDb().prepare("DELETE FROM transactions WHERE id = ?").run(id);
}
