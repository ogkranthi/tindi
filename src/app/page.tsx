import Link from "next/link";
import { listMembers } from "@/lib/db";
import { MODULES } from "@/lib/modules";

export const dynamic = "force-dynamic";

export default function Home() {
  const members = listMembers();
  const hasKey = !!process.env.OPENROUTER_API_KEY;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-stone-900">Welcome home 🌿</h1>
        <p className="mt-1 text-stone-600">
          Tindi is your family&apos;s operating system. Today it runs the kitchen and your
          health — plans meals around everyone&apos;s real needs, builds the grocery run, and
          turns what you eat into personalized insights.
        </p>
      </section>

      {!hasKey && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Set up needed:</strong> add your <code>OPENROUTER_API_KEY</code> to enable AI
          meal plans and insights.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((m) =>
            m.status === "active" ? (
              <Link key={m.id} href={m.href} className="card p-5 transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{m.icon}</div>
                  <span className="chip bg-herb-100 text-herb-700">Active</span>
                </div>
                <h3 className="mt-2 font-semibold">{m.name}</h3>
                <p className="mt-1 text-sm text-stone-600">{m.blurb}</p>
              </Link>
            ) : (
              <div key={m.id} className="card p-5 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="text-3xl grayscale">{m.icon}</div>
                  <span className="chip bg-stone-100 text-stone-500">Coming soon</span>
                </div>
                <h3 className="mt-2 font-semibold text-stone-700">{m.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{m.blurb}</p>
              </div>
            )
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">The family</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {members.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.name}</span>
                <span className="chip bg-herb-100 text-herb-700">
                  {m.role}
                  {m.ageYears ? ` · ${m.ageYears}y` : ""}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.conditions.map((c) => (
                  <span key={c} className="chip bg-stone-100 text-stone-500">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Link href="/family" className="mt-3 inline-block text-sm text-herb-700 hover:underline">
          Edit family profiles →
        </Link>
      </section>
    </div>
  );
}
