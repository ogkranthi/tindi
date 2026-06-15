import Link from "next/link";
import { getCachedInsights, listMembers } from "@/lib/db";
import { getMemberNutrition, type MemberNutrition, type NutrientStat } from "@/lib/insights";
import { weekStart } from "@/lib/dates";
import type { Member, NutrientVector } from "@/lib/types";
import StatRing from "@/components/StatRing";
import InsightsPanel from "@/components/InsightsPanel";

export const dynamic = "force-dynamic";

// Which nutrient rings matter most for a member, given their conditions.
function relevantKeys(member: Member): (keyof NutrientVector)[] {
  const keys = new Set<keyof NutrientVector>(["protein", "fiber"]);
  if (member.conditions.includes("pregnancy"))
    ["folate", "iron", "calcium", "omega3"].forEach((k) => keys.add(k as keyof NutrientVector));
  if (member.conditions.includes("prediabetes"))
    ["glycemicLoad", "sugar"].forEach((k) => keys.add(k as keyof NutrientVector));
  if (member.conditions.includes("hypothyroid"))
    ["selenium", "iodine"].forEach((k) => keys.add(k as keyof NutrientVector));
  return [...keys];
}

function stat(n: MemberNutrition, key: keyof NutrientVector): NutrientStat {
  return n.stats.find((s) => s.key === key)!;
}

function glucoseScore(n: MemberNutrition): number {
  const gl = stat(n, "glycemicLoad").pct;
  const sugar = stat(n, "sugar").pct;
  const fiber = Math.min(100, stat(n, "fiber").pct);
  return Math.round((gl + sugar + fiber) / 3);
}

export default async function HealthPage() {
  const members = listMembers();
  const start = weekStart();
  const hasKey = !!process.env.OPENROUTER_API_KEY;

  const data = await Promise.all(
    members.map(async (m) => ({
      member: m,
      nutrition: await getMemberNutrition(m, start),
      insights: getCachedInsights(m.id, start),
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Health insights</h1>
          <p className="mt-1 text-sm text-stone-500">
            Week of {start}, built from what each person logged.{" "}
            <Link href="/track" className="text-herb-700 hover:underline">
              Log food →
            </Link>
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {data.map(({ member, nutrition, insights }) => {
          const keys = relevantKeys(member);
          return (
            <section key={member.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-stone-900">{member.name}</h2>
                <span className="chip bg-herb-100 text-herb-700">{member.role}</span>
                {nutrition.trimester && (
                  <span className="chip bg-rose-100 text-rose-700">
                    Pregnancy · wk {nutrition.trimester.weeksPregnant} · T{nutrition.trimester.trimester}
                  </span>
                )}
                <span className="ml-auto text-xs text-stone-400">
                  {nutrition.logCount} items logged this week
                </span>
              </div>

              {nutrition.logCount === 0 ? (
                <p className="mt-3 text-sm text-stone-500">
                  Nothing logged yet.{" "}
                  <Link href="/meal-plan" className="text-herb-700 hover:underline">
                    Tap “Ate this” on the meal plan
                  </Link>{" "}
                  or{" "}
                  <Link href="/track" className="text-herb-700 hover:underline">
                    quick-log here
                  </Link>
                  .
                </p>
              ) : (
                <>
                  {/* Condition score badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.conditions.includes("prediabetes") && (
                      <span className="chip bg-orange-100 text-orange-700">
                        Glucose-friendly score: {glucoseScore(nutrition)}/100
                      </span>
                    )}
                    {member.conditions.includes("picky-eater") && (
                      <span className="chip bg-purple-100 text-purple-700">
                        Variety: {nutrition.variety.distinctThisWeek} foods
                        {nutrition.variety.newThisWeek.length
                          ? ` · ${nutrition.variety.newThisWeek.length} new`
                          : ""}
                      </span>
                    )}
                    {member.conditions.includes("hypothyroid") && (
                      <span className="chip bg-sky-100 text-sky-700">
                        Thyroid: Se {stat(nutrition, "selenium").pct}% · I {stat(nutrition, "iodine").pct}%
                      </span>
                    )}
                  </div>

                  {/* Nutrient rings */}
                  <div className="mt-4 flex flex-wrap gap-4">
                    {keys.map((k) => {
                      const s = stat(nutrition, k);
                      return (
                        <StatRing
                          key={k}
                          label={s.label}
                          value={s.value}
                          target={s.target}
                          unit={s.unit}
                          pct={s.pct}
                        />
                      );
                    })}
                  </div>

                  {nutrition.variety.newThisWeek.length > 0 &&
                    member.conditions.includes("picky-eater") && (
                      <p className="mt-3 text-xs text-stone-500">
                        🎉 New foods tried: {nutrition.variety.newThisWeek.join(", ")}
                      </p>
                    )}

                  {nutrition.nutritionUnavailable && (
                    <p className="mt-3 text-xs text-amber-700">
                      Nutrient estimates need OPENROUTER_API_KEY — category progress still shows on{" "}
                      <Link href="/track" className="underline">
                        Track
                      </Link>
                      .
                    </p>
                  )}
                </>
              )}

              <InsightsPanel memberId={member.id} initial={insights} hasKey={hasKey} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
