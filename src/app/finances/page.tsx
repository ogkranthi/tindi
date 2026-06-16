import { listMembers, listTransactions } from "@/lib/db";
import { isoDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import FinanceInsights from "@/components/FinanceInsights";
import TransactionComposer from "@/components/TransactionComposer";
import TransactionRow from "@/components/TransactionRow";

export const dynamic = "force-dynamic";

function monthRange(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const label = from.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return { from: isoDate(from), to: isoDate(to), label };
}

export default function FinancesPage() {
  const members = listMembers();
  const today = isoDate(new Date());
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  const { from, to, label } = monthRange();

  const txns = listTransactions(from, to);
  const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  const byCategory: Record<string, number> = {};
  for (const t of txns) {
    if (t.type !== "expense") continue;
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCat = categories.length ? categories[0][1] : 0;

  const nameOf = (id?: string) => members.find((m) => m.id === id)?.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">💰 Finances</h1>
        <p className="mt-1 text-sm text-stone-500">Household money for {label}.</p>
      </div>

      {/* Month summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-stone-400">Income</div>
          <div className="mt-1 text-xl font-semibold text-herb-700">{formatINR(income)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-stone-400">Spent</div>
          <div className="mt-1 text-xl font-semibold text-clay-600">{formatINR(expense)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-stone-400">Net</div>
          <div
            className={`mt-1 text-xl font-semibold ${net >= 0 ? "text-herb-700" : "text-red-600"}`}
          >
            {net < 0 ? "−" : ""}
            {formatINR(Math.abs(net))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TransactionComposer
            members={members.map((m) => ({ id: m.id, name: m.name }))}
            today={today}
          />

          <FinanceInsights hasKey={hasKey} />

          {/* Spending by category */}
          {categories.length > 0 && (
            <div className="card p-4">
              <h2 className="mb-3 font-semibold text-stone-900">Spending by category</h2>
              <div className="space-y-2">
                {categories.map(([cat, amt]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">{cat}</span>
                      <span className="font-medium text-stone-800">{formatINR(amt)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-clay-400"
                        style={{ width: `${maxCat ? (amt / maxCat) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card p-4">
          <h2 className="mb-2 font-semibold text-stone-900">This month</h2>
          {txns.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">
              No transactions yet. Add one to get started.
            </p>
          ) : (
            <div>
              {txns.map((t) => (
                <TransactionRow key={t.id} txn={t} paidByName={nameOf(t.paidBy)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
