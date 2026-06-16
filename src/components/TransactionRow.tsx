"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatINR } from "@/lib/money";
import type { Transaction } from "@/lib/types";

export default function TransactionRow({
  txn,
  paidByName,
}: {
  txn: Transaction;
  paidByName?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const income = txn.type === "income";

  async function remove() {
    setBusy(true);
    try {
      await fetch(`/api/finances?id=${encodeURIComponent(txn.id)}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone-100 py-2 text-sm last:border-0">
      <div className="min-w-0">
        <div className="truncate font-medium text-stone-800">{txn.description || txn.category}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-stone-400">
          <span>{txn.date}</span>
          <span className="chip bg-stone-100 text-stone-500">{txn.category}</span>
          {paidByName && <span>· {paidByName}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={income ? "font-semibold text-herb-700" : "font-semibold text-stone-800"}>
          {income ? "+" : "−"}
          {formatINR(txn.amount)}
        </span>
        <button
          onClick={remove}
          disabled={busy}
          title="Delete"
          className="text-stone-300 hover:text-red-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
