import { NextResponse } from "next/server";
import { getChildMembers, setActivityMark } from "@/lib/db";
import type { ToddlerActivity } from "@/lib/types";

export const runtime = "nodejs";

// Toggle a "done" or "favorite" mark on one activity. No AI — works without a key.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { planId, activityId, field, value, activity } = body as {
    planId?: string;
    activityId?: string;
    field?: string;
    value?: boolean;
    activity?: ToddlerActivity;
  };

  if (
    typeof planId !== "string" ||
    typeof activityId !== "string" ||
    (field !== "done" && field !== "favorite") ||
    typeof value !== "boolean" ||
    !activity ||
    typeof activity.title !== "string"
  ) {
    return NextResponse.json({ error: "Invalid mark request." }, { status: 400 });
  }

  const children = getChildMembers();
  if (children.length === 0) {
    return NextResponse.json({ error: "No child configured." }, { status: 400 });
  }
  const child =
    (typeof body.childId === "string" && children.find((c) => c.id === body.childId)) ||
    children[0];

  const mark = setActivityMark(planId, activityId, child.id, field, value, activity);
  return NextResponse.json({ ok: true, done: mark.done, favorite: mark.favorite });
}
