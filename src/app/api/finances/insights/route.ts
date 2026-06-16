import { NextResponse } from "next/server";
import { listMembers, listTransactions } from "@/lib/db";
import { isoDate } from "@/lib/dates";
import { chat, defaultModel, OpenRouterError, parseJsonObject } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 60;

// First and last day of the month containing `d`.
function monthRange(d = new Date()): { from: string; to: string } {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: isoDate(from), to: isoDate(to) };
}

export async function POST() {
  try {
    const { from, to } = monthRange();
    const txns = listTransactions(from, to);
    if (txns.length === 0) {
      return NextResponse.json(
        { error: "Add a few transactions this month first, then I can analyze them." },
        { status: 400 }
      );
    }

    const members = listMembers();
    const nameOf = (id?: string) => members.find((m) => m.id === id)?.name ?? "unspecified";

    const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const byCategory: Record<string, number> = {};
    for (const t of txns) {
      if (t.type !== "expense") continue;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }

    const ledger = txns
      .map((t) => `${t.date} | ${t.type} | ${t.category} | ₹${t.amount} | ${t.description || "—"} | by ${nameOf(t.paidBy)}`)
      .join("\n");

    const system = [
      "You are Tindi's household finance helper for an Indian family. All money is in Indian Rupees (₹).",
      "Give practical, encouraging, judgement-free budgeting guidance grounded ONLY in the data provided.",
      "Be specific and numeric (cite ₹ amounts and categories). Keep it short and actionable.",
      'Return STRICT JSON only: { "summary": "2-3 sentence read of this month\'s spending vs income", "tips": ["3-4 concrete, specific suggestions, each citing a category and ₹ amount where relevant"] }',
    ].join("\n");

    const user = [
      `Month: ${from} to ${to}.`,
      `Total income: ₹${income}. Total expense: ₹${expense}. Net: ₹${income - expense}.`,
      "Spending by category:",
      Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([c, v]) => `- ${c}: ₹${v}`)
        .join("\n"),
      "",
      "Transactions:",
      ledger,
    ].join("\n");

    const raw = await chat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      json: true,
      temperature: 0.5,
      maxTokens: 1200,
    });

    const parsed = parseJsonObject<{ summary?: string; tips?: string[] }>(raw);
    return NextResponse.json({
      summary: parsed.summary ?? "",
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      model: defaultModel(),
    });
  } catch (err) {
    const status = err instanceof OpenRouterError ? 502 : 500;
    const message = err instanceof Error ? err.message : "Failed to analyze finances.";
    return NextResponse.json({ error: message }, { status });
  }
}
