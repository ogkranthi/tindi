"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ToddlerStory } from "@/lib/types";

const ANIMAL_EMOJI: Record<string, string> = {
  cow: "🐄",
  pig: "🐷",
  duck: "🦆",
  horse: "🐴",
};

export default function StoryCard({ story }: { story: ToddlerStory }) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(story.favorite);
  const [busy, setBusy] = useState(false);

  async function toggleFavorite() {
    if (busy) return;
    const next = !favorite;
    setFavorite(next);
    setBusy(true);
    try {
      const res = await fetch("/api/toddler-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: story.id, favorite: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFavorite(!next);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    if (!confirm("Delete this story?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/toddler-story?id=${encodeURIComponent(story.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
          <span>{ANIMAL_EMOJI[story.animal] ?? "📖"}</span>
          {story.title}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFavorite}
            disabled={busy}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className={`chip border ${
              favorite
                ? "border-amber-500 bg-amber-100 text-amber-700"
                : "border-stone-300 bg-white text-stone-500 hover:bg-stone-50"
            }`}
          >
            {favorite ? "★" : "☆"}
          </button>
          <button
            onClick={remove}
            disabled={busy}
            aria-label="Delete story"
            className="chip border border-stone-300 bg-white text-stone-400 hover:bg-stone-50 hover:text-red-600"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-stone-700">
        {story.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {story.refrain && (
        <p className="mt-3 text-center text-sm font-semibold text-herb-700">{story.refrain}</p>
      )}

      {story.moral && (
        <p className="mt-3 rounded-lg bg-herb-50 p-2 text-sm text-herb-700">💛 {story.moral}</p>
      )}
    </article>
  );
}
