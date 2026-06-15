import Link from "next/link";
import { getGroceryList, getLatestMealPlan } from "@/lib/db";
import { groupByAisle } from "@/lib/grocery";
import GroceryList from "@/components/GroceryList";

export const dynamic = "force-dynamic";

export default function GroceryPage() {
  const plan = getLatestMealPlan();
  const list = plan ? getGroceryList(plan.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Grocery list</h1>
        {plan && (
          <Link href="/meal-plan" className="btn-ghost">
            🍽️ Back to meal plan
          </Link>
        )}
      </div>

      {!list || list.items.length === 0 ? (
        <p className="text-stone-600">
          No grocery list yet.{" "}
          <Link href="/meal-plan" className="text-herb-700 hover:underline">
            Generate a meal plan
          </Link>{" "}
          and it&apos;ll build automatically.
        </p>
      ) : (
        <>
          <p className="text-sm text-stone-500">Week of {list.weekStart}, grouped by aisle.</p>
          <GroceryList mealPlanId={plan!.id} groups={groupByAisle(list)} />
        </>
      )}
    </div>
  );
}
