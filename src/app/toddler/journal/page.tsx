import Link from "next/link";
import { getChildMembers, listDoneActivities } from "@/lib/db";
import ActivityCard from "@/components/ActivityCard";
import type { ActivityMark } from "@/lib/types";

export const dynamic = "force-dynamic";

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ToddlerJournalPage() {
  const child = getChildMembers()[0];

  if (!child) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-stone-900">Journal</h1>
        <p className="text-stone-600">
          Add a child on the{" "}
          <Link href="/family" className="font-medium text-herb-700 underline">
            Family page
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  const done = listDoneActivities(child.id);

  // Group by the day each activity was completed (already newest-first).
  const groups = new Map<string, ActivityMark[]>();
  for (const m of done) {
    const key = (m.doneAt ?? "").slice(0, 10) || "Earlier";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Journal</h1>
        <p className="text-sm text-stone-500">
          Everything {child.name} has done — her growing keepsake.
        </p>
      </div>

      {done.length === 0 ? (
        <div className="card p-6 text-center text-stone-600">
          Nothing logged yet. Tap 🎉 We did this! on any activity in{" "}
          <Link href="/toddler" className="font-medium text-herb-700 underline">
            This Week
          </Link>{" "}
          to start the journal.
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                {date === "Earlier" ? "Earlier" : dayLabel(date)}
              </h2>
              <div className="grid gap-3">
                {items.map((m) => (
                  <ActivityCard
                    key={`${m.planId}-${m.activityId}`}
                    activity={m.activity}
                    planId={m.planId}
                    mark={m}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
