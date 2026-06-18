import ActivityActions from "@/components/ActivityActions";
import type { ActivityDomain, ActivityMark, ToddlerActivity } from "@/lib/types";

const SETTING_ICON: Record<string, string> = {
  indoor: "🏠",
  outdoor: "🌳",
  either: "🔄",
};

const DOMAIN_COLOR: Record<ActivityDomain, string> = {
  "gross-motor": "bg-orange-100 text-orange-700",
  "fine-motor": "bg-amber-100 text-amber-700",
  language: "bg-sky-100 text-sky-700",
  cognitive: "bg-indigo-100 text-indigo-700",
  "social-emotional": "bg-rose-100 text-rose-700",
  creativity: "bg-purple-100 text-purple-700",
  sensory: "bg-herb-100 text-herb-700",
};

const DOMAIN_LABEL: Record<ActivityDomain, string> = {
  "gross-motor": "gross motor",
  "fine-motor": "fine motor",
  language: "language",
  cognitive: "thinking",
  "social-emotional": "social-emotional",
  creativity: "creativity",
  sensory: "sensory",
};

export default function ActivityCard({
  activity,
  planId,
  mark,
}: {
  activity: ToddlerActivity;
  /** When set, the done/favorite toggles are shown. */
  planId?: string;
  mark?: ActivityMark;
}) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span>{SETTING_ICON[activity.setting] ?? "🎲"}</span>
            <span className="font-medium text-stone-900">{activity.title}</span>
          </div>
          {activity.description && (
            <p className="mt-1 text-sm text-stone-600">{activity.description}</p>
          )}
        </div>
        {activity.durationMinutes > 0 && (
          <span className="chip bg-stone-100 text-stone-500">⏱ {activity.durationMinutes}m</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {activity.domains.map((d) => (
          <span key={d} className={`chip ${DOMAIN_COLOR[d] ?? "bg-stone-100"}`}>
            {DOMAIN_LABEL[d] ?? d}
          </span>
        ))}
        {activity.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip bg-stone-50 text-stone-500">
            {t}
          </span>
        ))}
      </div>

      {activity.learningGoal && (
        <p className="mt-2 rounded-lg bg-herb-50 p-2 text-xs text-herb-700">
          💡 Builds: {activity.learningGoal}
        </p>
      )}

      {activity.safetyNote && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-700">
          ⚠️ {activity.safetyNote}
        </p>
      )}

      {(activity.steps.length > 0 || activity.materials.length > 0) && (
        <details className="group mt-2">
          <summary className="cursor-pointer text-xs font-medium text-stone-500 hover:text-stone-700">
            🧩 How to play
          </summary>
          <div className="mt-2 space-y-3 rounded-lg bg-stone-50 p-3">
            {activity.materials.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  You&apos;ll need
                </p>
                <ul className="grid gap-0.5 text-xs text-stone-600 sm:grid-cols-2">
                  {activity.materials.map((m, j) => (
                    <li key={j}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {activity.steps.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Steps
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-xs text-stone-600">
                  {activity.steps.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
            {activity.caregiverTip && (
              <p className="text-xs text-stone-500">
                <span className="font-medium text-stone-600">Tip:</span> {activity.caregiverTip}
              </p>
            )}
          </div>
        </details>
      )}

      {planId && (
        <div className="mt-3 flex justify-end">
          <ActivityActions
            planId={planId}
            activity={activity}
            initialDone={mark?.done ?? false}
            initialFavorite={mark?.favorite ?? false}
          />
        </div>
      )}
    </div>
  );
}
