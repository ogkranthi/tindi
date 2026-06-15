import Link from "next/link";
import { getLatestMealPlan, listMembers } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const members = listMembers();
  const plan = getLatestMealPlan();
  const hasKey = !!process.env.OPENROUTER_API_KEY;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-stone-900">Welcome home 🌿</h1>
        <p className="mt-1 text-stone-600">
          Your family&apos;s AI kitchen + health companion. We plan around everyone&apos;s real
          needs — pregnancy, prediabetes, thyroid, and a picky toddler — then turn it into a
          one-click grocery run.
        </p>
      </section>

      {!hasKey && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Set up needed:</strong> add your <code>OPENROUTER_API_KEY</code> to{" "}
          <code>.env.local</code> (copy from <code>.env.example</code>) to enable AI meal plans.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/meal-plan" className="card p-5 transition hover:shadow-md">
          <div className="text-3xl">🍽️</div>
          <h2 className="mt-2 font-semibold">This week&apos;s meal plan</h2>
          <p className="mt-1 text-sm text-stone-600">
            {plan
              ? `Plan for week of ${plan.weekStart} — ${plan.days.reduce((n, d) => n + d.meals.length, 0)} meals.`
              : "No plan yet. Generate one tailored to the family."}
          </p>
        </Link>
        <Link href="/grocery" className="card p-5 transition hover:shadow-md">
          <div className="text-3xl">🛒</div>
          <h2 className="mt-2 font-semibold">Grocery list</h2>
          <p className="mt-1 text-sm text-stone-600">
            Auto-built from the meal plan, grouped by aisle. Check items off as you shop.
          </p>
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">The family</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {members.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.name}</span>
                <span className="chip bg-herb-100 text-herb-700">
                  {m.role}
                  {m.ageYears ? ` · ${m.ageYears}y` : ""}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                {m.healthNotes.slice(0, 2).map((n, i) => (
                  <li key={i}>• {n.split(" — ")[0]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href="/family" className="mt-3 inline-block text-sm text-herb-700 hover:underline">
          Edit family profiles →
        </Link>
      </section>
    </div>
  );
}
