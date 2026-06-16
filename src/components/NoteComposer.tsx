"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Member } from "@/lib/types";

export default function NoteComposer({ members }: { members: Pick<Member, "id" | "name">[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [memberId, setMemberId] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim() && !body.trim()) {
      setError("Add a title or some content.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          memberId: memberId || undefined,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the note.");
      setTitle("");
      setBody("");
      setMemberId("");
      setTags("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the note.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + New note
      </button>
    );
  }

  return (
    <div className="card space-y-3 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium focus:border-herb-500 focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a note, list, or reminder…"
        rows={4}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-herb-500 focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="">Whole family</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags, comma, separated"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-herb-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save note"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  );
}
