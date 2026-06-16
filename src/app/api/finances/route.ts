import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { deleteTransaction, listMembers, listTransactions, saveTransaction } from "@/lib/db";
import { isoDate } from "@/lib/dates";
import { FINANCE_CATEGORIES, type FinanceCategory, type Transaction } from "@/lib/types";

export const runtime = "nodejs";

const isCategory = (c: unknown): c is FinanceCategory =>
  FINANCE_CATEGORIES.includes(c as FinanceCategory);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  return NextResponse.json({ transactions: listTransactions(from, to) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<Transaction> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than 0." }, { status: 400 });
  }

  const type = body.type === "income" ? "income" : "expense";
  const category: FinanceCategory = isCategory(body.category)
    ? body.category
    : type === "income"
      ? "income"
      : "other";

  const memberIds = new Set(listMembers().map((m) => m.id));
  const paidBy = body.paidBy && memberIds.has(body.paidBy) ? body.paidBy : undefined;

  const t: Transaction = {
    id: body.id || randomUUID(),
    date: typeof body.date === "string" && body.date ? body.date : isoDate(new Date()),
    description: (body.description ?? "").trim(),
    amount: Math.round(amount * 100) / 100,
    type,
    category,
    paidBy,
    createdAt: new Date().toISOString(),
  };

  saveTransaction(t);
  return NextResponse.json({ ok: true, id: t.id });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  deleteTransaction(id);
  return NextResponse.json({ ok: true });
}
