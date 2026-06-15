// Thin OpenRouter client. All model usage in Tindi routes through here so we can
// swap models, add caching, or change providers in one place.

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * The model chain to try, in order. OPENROUTER_MODEL may be a single slug or a
 * comma-separated list. We keep a known-good fallback so a bad/unavailable
 * primary slug never breaks the app.
 */
export function defaultModels(): string[] {
  const env = process.env.OPENROUTER_MODEL;
  const chain = env
    ? env.split(",").map((s) => s.trim()).filter(Boolean)
    : ["anthropic/claude-sonnet-4.5"];
  // Always keep a broadly-available last resort.
  if (!chain.includes("anthropic/claude-3.5-sonnet")) chain.push("anthropic/claude-3.5-sonnet");
  return chain;
}

export function defaultModel(): string {
  return defaultModels()[0];
}

export class OpenRouterError extends Error {
  /** When true, retrying a different model won't help (auth, credits, etc.). */
  fatal: boolean;
  constructor(message: string, fatal = false) {
    super(message);
    this.fatal = fatal;
  }
}

interface ChatOptions {
  messages: ChatMessage[];
  /** Force a single model (skips the fallback chain). */
  model?: string;
  /** Override the fallback chain. */
  models?: string[];
  temperature?: number;
  /** Ask the model to emit a JSON object. */
  json?: boolean;
  /** Cap output tokens (raise for large structured responses). */
  maxTokens?: number;
}

async function callModel(
  apiKey: string,
  model: string,
  opts: ChatOptions
): Promise<string> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_APP_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Tindi",
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0.6,
      messages: opts.messages,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const snippet = text.slice(0, 500);
    // 401/403 = bad key, 402 = no credits — retrying another model won't help.
    if (res.status === 401 || res.status === 403) {
      throw new OpenRouterError(
        `OpenRouter rejected the API key (${res.status}). Update the OPENROUTER_API_KEY secret. ${snippet}`,
        true
      );
    }
    if (res.status === 402) {
      throw new OpenRouterError(
        `OpenRouter account is out of credits (402). Add credits to your OpenRouter account. ${snippet}`,
        true
      );
    }
    throw new OpenRouterError(`Model "${model}" failed (${res.status}): ${snippet}`);
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
  };
  const choice = body.choices?.[0];
  const content = choice?.message?.content;
  if (!content) throw new OpenRouterError(`Model "${model}" returned an empty response.`);
  if (choice?.finish_reason === "length") {
    throw new OpenRouterError(`Model "${model}" response was cut off (hit token limit).`);
  }
  return content;
}

export async function chat(opts: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not set. Add it to your environment (Fly secret / .env.local).",
      true
    );
  }

  const chain = opts.model ? [opts.model] : opts.models?.length ? opts.models : defaultModels();
  let lastErr: unknown;
  for (const model of chain) {
    try {
      return await callModel(apiKey, model, opts);
    } catch (err) {
      lastErr = err;
      if (err instanceof OpenRouterError && err.fatal) throw err; // don't try other models
      console.error(`[openrouter] model ${model} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new OpenRouterError("All models failed to respond.");
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
