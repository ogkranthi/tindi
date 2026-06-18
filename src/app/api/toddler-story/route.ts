import { NextResponse } from "next/server";
import {
  deleteToddlerStory,
  getChildMembers,
  getToddlerStory,
  saveToddlerStory,
} from "@/lib/db";
import { generateToddlerStory } from "@/lib/toddlerstory";
import { OpenRouterError } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST with {animal, theme?, notes?} generates a story.
// POST with {id, favorite} toggles a saved story's favorite flag.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Favorite toggle on an existing story.
    if (typeof body.id === "string" && typeof body.favorite === "boolean") {
      const existing = getToddlerStory(body.id);
      if (!existing) {
        return NextResponse.json({ error: "Story not found." }, { status: 404 });
      }
      existing.favorite = body.favorite;
      saveToddlerStory(existing);
      return NextResponse.json({ ok: true, favorite: existing.favorite });
    }

    const children = getChildMembers();
    if (children.length === 0) {
      return NextResponse.json(
        { error: "No child in the family yet. Add one on the Family page." },
        { status: 400 }
      );
    }
    const child =
      (typeof body.childId === "string" && children.find((c) => c.id === body.childId)) ||
      children[0];

    const animal = typeof body.animal === "string" ? body.animal.trim() : "";
    if (!animal) {
      return NextResponse.json({ error: "Pick an animal for the story." }, { status: 400 });
    }

    const story = await generateToddlerStory({
      child,
      animal,
      theme: typeof body.theme === "string" ? body.theme : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });

    saveToddlerStory(story);
    return NextResponse.json({ id: story.id });
  } catch (err) {
    const status = err instanceof OpenRouterError ? 502 : 500;
    const message = err instanceof Error ? err.message : "Failed to generate story.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  deleteToddlerStory(id);
  return NextResponse.json({ ok: true });
}
