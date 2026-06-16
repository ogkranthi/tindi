"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Note } from "@/lib/types";

export default function NoteCard({ note, authorName }: { note: Note; authorName?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function togglePin() {
    setBusy(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, pinned: !note.pinned }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this note?")) return;
    setBusy(true);
    try {
      await fetch(`/api/notes?id=${encodeURIComponent(note.id)}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card flex flex-col p-4 ${note.pinned ? "border-herb-200 bg-herb-50/40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-stone-900">{note.title || "Untitled"}</h3>
        <button
          onClick={togglePin}
          disabled={busy}
          title={note.pinned ? "Unpin" : "Pin"}
          className="shrink-0 text-lg leading-none"
        >
          {note.pinned ? "📌" : "📍"}
        </button>
      </div>

      {note.body && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{note.body}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1">
        {authorName && <span className="chip bg-herb-100 text-herb-700">{authorName}</span>}
        {note.tags.map((t) => (
          <span key={t} className="chip bg-stone-100 text-stone-500">
            #{t}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-xs text-stone-400">
        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
        <button onClick={remove} disabled={busy} className="text-stone-400 hover:text-red-600">
          Delete
        </button>
      </div>
    </div>
  );
}
