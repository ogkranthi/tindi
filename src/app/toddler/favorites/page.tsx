import Link from "next/link";
import { getChildMembers, listFavoriteActivities } from "@/lib/db";
import ActivityCard from "@/components/ActivityCard";

export const dynamic = "force-dynamic";

export default function ToddlerFavoritesPage() {
  const child = getChildMembers()[0];

  if (!child) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-stone-900">Favorites</h1>
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

  const favorites = listFavoriteActivities(child.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Favorites</h1>
        <p className="text-sm text-stone-500">
          Activities {child.name} loved — easy to come back to.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="card p-6 text-center text-stone-600">
          No favorites yet. Tap ☆ Favorite on any activity in{" "}
          <Link href="/toddler" className="font-medium text-herb-700 underline">
            This Week
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-3">
          {favorites.map((m) => (
            <ActivityCard
              key={`${m.planId}-${m.activityId}`}
              activity={m.activity}
              planId={m.planId}
              mark={m}
            />
          ))}
        </div>
      )}
    </div>
  );
}
