import Link from "next/link";
import { getLogsForWeek, listMembers } from "@/lib/db";
import { addDays, isoDate, weekStart } from "@/lib/dates";
import { CATEGORIES, type Category } from "@/lib/types";
import QuickLog from "@/components/QuickLog";

export const dynamic = "force-dynamic";

const CATEGORY_EMOJI: Record<Category, string> = {
  veggies: "🥦",
  fruits: "🍎",
  protein: "🍗",
  grains: "🌾",
  treats: "🍰",
};

export default function TrackPage() {
  const members = listMembers();
  const start = weekStart();
  const end = addDays(start, 6);
  const today = isoDate(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Track</h1>
          <p className="mt-1 text-sm text-stone-500">
            Week of {start}. Log against the weekly targets, or tap “Ate this” on the meal plan.
          </p>
        </div>
        <Link href="/health" className="btn-ghost">
          📊 See insights
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {members.map((m) => {
          const logs = getLogsForWeek(m.id, start, end);
          const totals: Record<Category, number> = {
            veggies: 0,
            fruits: 0,
            protein: 0,
            grains: 0,
            treats: 0,
          };
          for (const l of logs) {
            if ((CATEGORIES as string[]).includes(l.category)) {
              totals[l.category as Category] += l.servings || 1;
            }
          }
          return (
            <div key={m.id} className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-stone-900">{m.name}</h2>
                <span className="text-xs text-stone-400">{logs.length} logged</span>
              </div>
              <div className="mt-3 space-y-2">
                {CATEGORIES.map((c) => {
                  const have = Math.round(totals[c] * 10) / 10;
                  const goal = m.weeklyTargets[c];
                  const pct = goal ? Math.min(100, (have / goal) * 100) : 0;
                  return (
                    <div key={c}>
                      <div className="flex justify-between text-xs text-stone-500">
                        <span>
                          {CATEGORY_EMOJI[c]} {c}
                        </span>
                        <span>
                          {have} / {goal}
                        </span>
                      </div>
                      <div className="mt-0.5 h-2 rounded-full bg-stone-100">
                        <div
                          className="h-2 rounded-full bg-herb-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <QuickLog memberId={m.id} date={today} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
