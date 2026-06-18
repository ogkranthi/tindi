import { randomUUID } from "node:crypto";
import { chat, defaultModel, parseJsonObject } from "./openrouter";
import type { Member, ToddlerStory } from "./types";

export interface GenerateStoryOptions {
  child: Member;
  /** The animal/character the story should star, e.g. "cow", "duck". */
  animal: string;
  /** Optional gentle lesson/theme, e.g. "sharing", "bedtime", "being brave". */
  theme?: string;
  /** Free-text steer from the parent. */
  notes?: string;
}

export function buildPrompt(opts: GenerateStoryOptions): { system: string; user: string } {
  const age = opts.child.ageYears ?? 3;
  const animal = opts.animal.trim() || "animal";

  const system = [
    `You are Tindi, writing a short, gentle bedtime/playtime story for a ${age}-year-old child in a Telugu/Andhra Indian home.`,
    "STORY RULES:",
    `- The hero is a friendly ${animal}. Give it a warm, simple name.`,
    `- Keep it very simple and age-appropriate for a ${age}-year-old: short sentences, easy words, lots of repetition, and a sing-song rhythm.`,
    "- Keep it SHORT: 4-7 little paragraphs of 1-3 sentences each.",
    "- Make it cheerful, calm, and reassuring — never scary, sad, or violent. A happy ending.",
    "- Include the animal's sound as a fun repeated refrain the child can join in on (e.g. a cow says 'Moo moo!').",
    "- End with one tiny, gentle lesson a small child can understand (kindness, sharing, helping, brushing teeth, bedtime).",
    "- You may sprinkle in a simple Telugu word or two and a homely Indian setting (a village, a farm, ammamma/grandma) to make it feel at home.",
    "Return STRICT JSON only — no prose, no markdown.",
  ].join("\n");

  const schema = `{
  "title": "a short, fun title",
  "paragraphs": ["short paragraph", "short paragraph", "..."],
  "refrain": "the fun repeated sound, e.g. \\"Moo moo!\\"",
  "moral": "one short, gentle takeaway sentence"
}`;

  const user = [
    `Write a story starring a ${animal} for ${opts.child.name} (age ${age}).`,
    opts.theme ? `Gentle theme/lesson: ${opts.theme}.` : "",
    opts.notes ? `Extra from the parent: ${opts.notes}` : "",
    "",
    "Respond with JSON matching exactly this shape:",
    schema,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export async function generateToddlerStory(opts: GenerateStoryOptions): Promise<ToddlerStory> {
  const { system, user } = buildPrompt(opts);

  const raw = await chat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    json: true,
    temperature: 0.9, // stories want imagination
    maxTokens: 2000,
  });

  const parsed = parseJsonObject<{
    title?: string;
    paragraphs?: any[];
    refrain?: string;
    moral?: string;
  }>(raw);

  const paragraphs = Array.isArray(parsed.paragraphs)
    ? parsed.paragraphs.map((p: any) => String(p).trim()).filter(Boolean)
    : [];

  if (paragraphs.length === 0) {
    throw new Error("The model returned an empty story. Please try again.");
  }

  return {
    id: randomUUID(),
    childId: opts.child.id,
    childName: opts.child.name,
    ageYears: opts.child.ageYears ?? 3,
    animal: opts.animal.trim().toLowerCase(),
    title: String(parsed.title ?? `A ${opts.animal} story`),
    paragraphs,
    moral: String(parsed.moral ?? "").trim(),
    refrain: String(parsed.refrain ?? "").trim(),
    favorite: false,
    createdAt: new Date().toISOString(),
    model: defaultModel(),
  };
}
