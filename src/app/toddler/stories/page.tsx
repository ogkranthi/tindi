import Link from "next/link";
import { getChildMembers, listToddlerStories } from "@/lib/db";
import GenerateStory from "@/components/GenerateStory";
import StoryCard from "@/components/StoryCard";

export const dynamic = "force-dynamic";

export default function ToddlerStoriesPage() {
  const child = getChildMembers()[0];
  const hasKey = !!process.env.OPENROUTER_API_KEY;

  if (!child) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-stone-900">Stories</h1>
        <div className="card p-6 text-center">
          <p className="text-stone-600">
            No child in the family yet. Add one on the{" "}
            <Link href="/family" className="font-medium text-herb-700 underline">
              Family page
            </Link>{" "}
            to start making stories.
          </p>
        </div>
      </div>
    );
  }

  const stories = listToddlerStories(child.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Stories</h1>
        <p className="text-sm text-stone-500">
          Little stories made just for {child.name} · age {child.ageYears ?? 3}
        </p>
      </div>

      <GenerateStory hasKey={hasKey} childName={child.name} />

      {stories.length === 0 ? (
        <p className="text-stone-600">No stories yet — make {child.name}&apos;s first one above.</p>
      ) : (
        <div className="grid gap-4">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </div>
  );
}
