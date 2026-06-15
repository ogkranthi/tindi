import { NextResponse } from "next/server";
import { listMembers, saveGroceryList, saveMealPlan } from "@/lib/db";
import { generateMealPlan } from "@/lib/mealplan";
import { buildGroceryList } from "@/lib/grocery";
import { OpenRouterError } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const members = listMembers();
    if (members.length === 0) {
      return NextResponse.json({ error: "No family members configured." }, { status: 400 });
    }

    const plan = await generateMealPlan({
      members,
      cuisines: Array.isArray(body.cuisines) && body.cuisines.length ? body.cuisines : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });

    saveMealPlan(plan);
    const grocery = buildGroceryList(plan);
    saveGroceryList(grocery);

    return NextResponse.json({ id: plan.id });
  } catch (err) {
    const status = err instanceof OpenRouterError ? 502 : 500;
    const message = err instanceof Error ? err.message : "Failed to generate meal plan.";
    return NextResponse.json({ error: message }, { status });
  }
}
