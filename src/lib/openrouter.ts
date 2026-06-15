// Thin OpenRouter client. All model usage in Tindi routes through here so we can
// swap models, add caching, or change providers in one place.

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function defaultModel(): string {
  return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.6";
}

export class OpenRouterError extends Error {}

interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  /** Ask the model to emit a JSON object. */
  json?: boolean;
}

export async function chat({ messages, model, temperature = 0.6, json }: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_APP_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Tindi",
    },
    body: JSON.stringify({
      model: model || defaultModel(),
      temperature,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OpenRouterError(`OpenRouter request failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new OpenRouterError("OpenRouter returned an empty response.");
  return content;
}

/** Parse a JSON object from a model response, tolerating ```json fences. */
export function parseJsonObject<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // Fall back to the outermost { ... } if there's stray prose.
  if (!text.startsWith("{")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
  }
  return JSON.parse(text) as T;
}
