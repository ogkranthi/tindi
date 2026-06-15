import { NextResponse } from "next/server";
import { listMembers, saveMember } from "@/lib/db";
import type { Member } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ members: listMembers() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Member | null;
  if (!body || !body.id || !body.name) {
    return NextResponse.json({ error: "id and name are required." }, { status: 400 });
  }
  saveMember(body);
  return NextResponse.json({ ok: true });
}
