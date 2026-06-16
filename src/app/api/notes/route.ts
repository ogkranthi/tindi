import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { deleteNote, getNote, listNotes, saveNote } from "@/lib/db";
import type { Note } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ notes: listNotes() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<Note> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Merge with the existing note so partial updates (e.g. just toggling pin) are safe.
  const existing = body.id ? getNote(body.id) : null;
  const title = (body.title ?? existing?.title ?? "").trim();
  const noteBody = (body.body ?? existing?.body ?? "").trim();

  if (!title && !noteBody) {
    return NextResponse.json({ error: "A note needs a title or some content." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const note: Note = {
    id: existing?.id ?? randomUUID(),
    title,
    body: noteBody,
    memberId:
      body.memberId !== undefined ? body.memberId || undefined : existing?.memberId,
    tags: Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean)
      : existing?.tags ?? [],
    pinned: typeof body.pinned === "boolean" ? body.pinned : existing?.pinned ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  saveNote(note);
  return NextResponse.json({ ok: true, id: note.id });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  deleteNote(id);
  return NextResponse.json({ ok: true });
}
