"use client";

import { useState } from "react";
import type { Member } from "@/lib/types";

function MemberCard({ member }: { member: Member }) {
  const [m, setM] = useState<Member>(member);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  function setList(field: "healthNotes" | "likes" | "avoid" | "activity", value: string) {
    setM({ ...m, [field]: value.split("\n").map((s) => s.trim()).filter(Boolean) });
  }

  async function save() {
    setStatus("saving");
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(m),
    });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  const field = (
    label: string,
    f: "healthNotes" | "likes" | "avoid" | "activity",
    rows = 3
  ) => (
    <label className="block">
      <span className="text-xs font-medium text-stone-500">{label}</span>
      <textarea
        rows={rows}
        value={m[f].join("\n")}
        onChange={(e) => setList(f, e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-sm focus:border-herb-500 focus:outline-none"
      />
    </label>
  );

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-900">{m.name}</h2>
        <span className="chip bg-herb-100 text-herb-700">
          {m.role}
          {m.ageYears ? ` · ${m.ageYears}y` : ""}
          {m.wearable && m.wearable !== "none" ? ` · ${m.wearable}` : ""}
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {field("Health context (one per line)", "healthNotes", 4)}
        {field("Likes", "likes", 2)}
        {field("Avoid", "avoid", 2)}
        {field("Activity", "activity", 2)}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={status === "saving"} className="btn-primary">
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && <span className="text-sm text-herb-700">Saved ✓</span>}
      </div>
    </div>
  );
}

export default function FamilyEditor({ members }: { members: Member[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {members.map((m) => (
        <MemberCard key={m.id} member={m} />
      ))}
    </div>
  );
}
