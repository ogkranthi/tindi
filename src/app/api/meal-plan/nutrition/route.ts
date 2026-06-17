import { NextResponse } from "next/server";
import { getLatestMealPlan, getMealPlan, listMembers } from "@/lib/db";
import { buildPlanSufficiencyAll } from "@/lib/plan-nutrition";
import { OpenRouterError } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST { planId? } → per-member sufficiency forecast for the (latest) meal plan.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = body.planId ? getMealPlan(body.planId) : getLatestMealPlan();
    if (!plan) return NextResponse.json({ error: "No meal plan to check." }, { status: 400 });

    const results = await buildPlanSufficiencyAll(plan, listMembers());
    return NextResponse.json({ weekStart: plan.weekStart, results });
  } catch (err) {
    const status = err instanceof OpenRouterError ? 502 : 500;
    const message = err instanceof Error ? err.message : "Failed to check the plan.";
    return NextResponse.json({ error: message }, { status });
  }
}
