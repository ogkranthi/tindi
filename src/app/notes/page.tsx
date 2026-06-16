import { listMembers, listNotes } from "@/lib/db";
import NoteCard from "@/components/NoteCard";
import NoteComposer from "@/components/NoteComposer";

export const dynamic = "force-dynamic";

export default function NotesPage() {
  const members = listMembers();
  const notes = listNotes();
  const nameOf = (id?: string) => members.find((m) => m.id === id)?.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">📝 Notes</h1>
          <p className="mt-1 text-sm text-stone-500">
            Shared family notes, reminders, and lists. Pin the ones that matter.
          </p>
        </div>
        <NoteComposer members={members.map((m) => ({ id: m.id, name: m.name }))} />
      </div>

      {notes.length === 0 ? (
        <div className="card p-8 text-center text-stone-500">
          No notes yet. Use <span className="font-medium text-stone-700">+ New note</span> to add the
          first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} authorName={nameOf(n.memberId)} />
          ))}
        </div>
      )}
    </div>
  );
}
