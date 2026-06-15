import { NextResponse } from "next/server";
import { listMembers } from "@/lib/db";
import { buildMemberInsights } from "@/lib/insights";
import { weekStart } from "@/lib/dates";
import { OpenRouterError } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST { memberId, force? } → (re)build cached weekly insights for that member.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const member = listMembers().find((m) => m.id === body.memberId);
    if (!member) return NextResponse.json({ error: "Unknown member." }, { status: 400 });

    const insights = await buildMemberInsights(member, body.weekStart || weekStart(), {
      force: !!body.force,
    });
    return NextResponse.json({ insights });
  } catch (err) {
    const status = err instanceof OpenRouterError ? 502 : 500;
    const message = err instanceof Error ? err.message : "Failed to build insights.";
    return NextResponse.json({ error: message }, { status });
  }
}
