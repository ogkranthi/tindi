import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SEED_FAMILY } from "./family";
import type { GroceryList, MealPlan, Member } from "./types";

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
  return db;
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

    -- Foundation for the daily tracking + streaks slice (built next).
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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
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
  return rows.map((r) => JSON.parse(r.data) as Member);
}

export function saveMember(member: Member): void {
  getDb()
    .prepare(
      "INSERT INTO members (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
    )
    .run(member.id, JSON.stringify(member));
}

// ---- Meal plans ----

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
  return row ? (JSON.parse(row.data) as MealPlan) : null;
}

export function getLatestMealPlan(): MealPlan | null {
  const row = getDb()
    .prepare("SELECT data FROM meal_plans ORDER BY created_at DESC LIMIT 1")
    .get() as { data: string } | undefined;
  return row ? (JSON.parse(row.data) as MealPlan) : null;
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
