import { NextResponse } from "next/server";
import { chat, defaultModels, OpenRouterError } from "@/lib/openrouter";
import { listMembers } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// Lightweight health/diagnostics for the AI pipeline. Open in a browser to see
// exactly why generation might be failing (key, credits, model, or parsing).
export async function GET() {
  const keyPresent = !!process.env.OPENROUTER_API_KEY;
  const models = defaultModels();
  const result: Record<string, unknown> = {
    keyPresent,
    keyLength: process.env.OPENROUTER_API_KEY?.length ?? 0,
    models,
    members: listMembers().length,
    appUrl: process.env.OPENROUTER_APP_URL ?? null,
  };

  if (!keyPresent) {
    result.ok = false;
    result.reason = "OPENROUTER_API_KEY is not set in this environment.";
    return NextResponse.json(result, { status: 200 });
  }

  // One tiny model ping to confirm the key + a model actually work.
  try {
    const reply = await chat({
      messages: [{ role: "user", content: "Reply with the single word: ok" }],
      maxTokens: 5,
      temperature: 0,
    });
    result.ok = true;
    result.modelReply = reply.trim().slice(0, 40);
  } catch (err) {
    result.ok = false;
    result.fatal = err instanceof OpenRouterError ? err.fatal : false;
    result.reason = err instanceof Error ? err.message : "Unknown error";
  }
  return NextResponse.json(result, { status: 200 });
}
