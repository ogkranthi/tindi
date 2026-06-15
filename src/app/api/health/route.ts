import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight liveness probe for Fly's health checks. No DB/AI work on purpose.
export async function GET() {
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}
