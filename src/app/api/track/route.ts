import { NextResponse } from "next/server";
import { insertFoodLogs, listMembers, type NewFoodLog } from "@/lib/db";
import { CATEGORIES, type Category } from "@/lib/types";
import { weekStart } from "@/lib/dates";

export const runtime = "nodejs";

const isCategory = (c: unknown): c is Category => CATEGORIES.includes(c as Category);

// Accepts either a single log or a batch of entries (used by "Ate this").
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const memberIds = new Set(listMembers().map((m) => m.id));
  const today = weekStart(new Date()); // fallback only; entries should carry a date

  const rawEntries: any[] = Array.isArray(body.entries) ? body.entries : [body];
  const entries: NewFoodLog[] = [];

  for (const e of rawEntries) {
    if (!e || !memberIds.has(e.memberId) || !isCategory(e.category)) continue;
    entries.push({
      memberId: e.memberId,
      category: e.category,
      servings: Number.isFinite(e.servings) ? Number(e.servings) : 1,
      food: typeof e.food === "string" && e.food.trim() ? e.food.trim() : null,
      source: e.source === "plan" ? "plan" : "manual",
      logDate: typeof e.logDate === "string" ? e.logDate : typeof e.date === "string" ? e.date : today,
    });
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid log entries." }, { status: 400 });
  }
  insertFoodLogs(entries);
  return NextResponse.json({ ok: true, logged: entries.length });
}
