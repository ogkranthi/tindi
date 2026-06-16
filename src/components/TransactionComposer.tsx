"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FINANCE_CATEGORIES, type FinanceCategory, type Member, type TransactionType } from "@/lib/types";

export default function TransactionComposer({
  members,
  today,
}: {
  members: Pick<Member, "id" | "name">[];
  today: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FinanceCategory>("groceries");
  const [date, setDate] = useState(today);
  const [paidBy, setPaidBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: value,
          description,
          category: type === "income" ? "income" : category,
          date,
          paidBy: paidBy || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setAmount("");
      setDescription("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex gap-2">
        <button
          onClick={() => setType("expense")}
          className={`chip cursor-pointer ${type === "expense" ? "bg-clay-500 text-white" : "bg-stone-100 text-stone-500"}`}
        >
          Expense
        </button>
        <button
          onClick={() => setType("income")}
          className={`chip cursor-pointer ${type === "income" ? "bg-herb-600 text-white" : "bg-stone-100 text-stone-500"}`}
        >
          Income
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center rounded-lg border border-stone-300 px-2">
          <span className="text-sm text-stone-500">₹</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="w-24 px-1 py-1.5 text-sm focus:outline-none"
          />
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-herb-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {type === "expense" && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FinanceCategory)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
          >
            {FINANCE_CATEGORIES.filter((c) => c !== "income").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        />
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="">{type === "income" ? "Earned by…" : "Paid by…"}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? "Saving…" : `+ Add ${type}`}
      </button>
    </div>
  );
}
