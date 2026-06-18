import { NextResponse } from "next/server";
import { getChildMembers, saveToddlerPlan } from "@/lib/db";
import { generateToddlerPlan } from "@/lib/toddlerplan";
import { OpenRouterError } from "@/lib/openrouter";
import { ACTIVITY_DOMAINS, type ActivityDomain, type ActivitySetting } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const SETTINGS = new Set<ActivitySetting>(["indoor", "outdoor", "either"]);
const DOMAINS = new Set<string>(ACTIVITY_DOMAINS);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const children = getChildMembers();
    if (children.length === 0) {
      return NextResponse.json(
        { error: "No child in the family yet. Add one on the Family page." },
        { status: 400 }
      );
    }

    const child =
      (typeof body.childId === "string" && children.find((c) => c.id === body.childId)) ||
      children[0];

    const focuses = Array.isArray(body.focuses)
      ? (body.focuses.filter((f: any) => DOMAINS.has(f)) as ActivityDomain[])
      : undefined;

    const plan = await generateToddlerPlan({
      child,
      setting: SETTINGS.has(body.setting) ? (body.setting as ActivitySetting) : undefined,
      focuses: focuses?.length ? focuses : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });

    saveToddlerPlan(plan);
    return NextResponse.json({ id: plan.id });
  } catch (err) {
    const status = err instanceof OpenRouterError ? 502 : 500;
    const message = err instanceof Error ? err.message : "Failed to generate plan.";
    return NextResponse.json({ error: message }, { status });
  }
}
