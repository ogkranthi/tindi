import { NextResponse } from "next/server";
import { getGroceryList, saveGroceryList } from "@/lib/db";

export const runtime = "nodejs";

// Toggle (or set) the checked state of a single grocery item.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { mealPlanId, item, unit, checked } = body as {
    mealPlanId?: string;
    item?: string;
    unit?: string;
    checked?: boolean;
  };
  if (!mealPlanId || !item) {
    return NextResponse.json({ error: "mealPlanId and item are required." }, { status: 400 });
  }
  const list = getGroceryList(mealPlanId);
  if (!list) return NextResponse.json({ error: "Grocery list not found." }, { status: 404 });

  const target = list.items.find(
    (i) => i.item === item && (unit === undefined || i.unit === unit)
  );
  if (target) target.checked = checked ?? !target.checked;
  saveGroceryList(list);
  return NextResponse.json({ ok: true });
}
