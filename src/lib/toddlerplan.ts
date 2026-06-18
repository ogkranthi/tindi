import { randomUUID } from "node:crypto";
import { chat, defaultModel, parseJsonObject } from "./openrouter";
import { DAY_NAMES, addDays, weekStart } from "./dates";
import {
  ACTIVITY_DOMAINS,
  type ActivityDomain,
  type ActivitySetting,
  type Member,
  type ToddlerActivity,
  type ToddlerDay,
  type ToddlerPlan,
} from "./types";

export interface GenerateToddlerOptions {
  child: Member;
  /** Bias the week toward indoor, outdoor, or a balanced mix. */
  setting?: ActivitySetting;
  /** Developmental skills to emphasize this week. */
  focuses?: ActivityDomain[];
  /** Free-text steer, e.g. "she loves water play; we have a small balcony". */
  notes?: string;
  season?: string;
  weekStartDate?: string;
}

function childBrief(m: Member): string {
  return [
    `- ${m.name} (age ${m.ageYears ?? 3}):`,
    ...m.healthNotes.map((n) => `    note: ${n}`),
    m.likes.length ? `    likes: ${m.likes.join(", ")}` : "",
    m.avoid.length ? `    avoid: ${m.avoid.join(", ")}` : "",
    m.activity.length ? `    activity: ${m.activity.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildPrompt(opts: GenerateToddlerOptions): { system: string; user: string } {
  const age = opts.child.ageYears ?? 3;
  const season = opts.season || "summer";
  const settingPref =
    opts.setting === "indoor"
      ? "Lean toward INDOOR activities (hot afternoons), but keep a few cooler-hour outdoor options."
      : opts.setting === "outdoor"
        ? "Lean toward OUTDOOR play in the cooler morning/evening hours, with indoor backups for midday heat."
        : "Mix indoor and outdoor activities; schedule outdoor play for cooler morning/evening hours.";

  const system = [
    `You are Tindi, planning a week of fun, safe, growth-oriented play and learning for a ${age}-year-old child in a Telugu/Andhra Indian home.`,
    "HARD RULES you must never break:",
    `- Everything must be age-appropriate for a ${age}-year-old's attention span, motor skills, and abilities.`,
    "- SAFETY FIRST. Be choking-aware (no whole nuts or small mouthable parts for a child this age), no unsupervised water play, use soft/blunt household materials, and always assume a caregiver is supervising.",
    `- ${season.toUpperCase()}-AWARE: avoid outdoor activities in the harsh midday sun; build in shade, hydration, and sun protection. Prefer cool indoor play in the afternoon.`,
    "- Respect the child's 'avoid' list.",
    "- Use COMMON, low-cost household items (vessels, spoons, cloth, paper, water, pulses/rice for sensory play under supervision, cardboard). No expensive or hard-to-find toys.",
    "BALANCE: across the week, mix indoor and outdoor, and spread activities across these developmental domains — gross-motor, fine-motor, language, cognitive, social-emotional, creativity, sensory.",
    settingPref,
    "Be EDUCATIONAL and CREATIVE. Each activity should clearly grow a skill. Keep a warm, encouraging tone for parents.",
    "You may weave in simple Telugu words, rhymes, counting, festivals, or safe kitchen/cultural play to make it feel at home.",
    "Give a weekly THEME that loosely ties the days together. Provide 2-3 activities per day, and 2-4 bigger weekend adventures/outings/projects.",
    "Return STRICT JSON only — no prose, no markdown. Keep each text field concise (one short sentence/clause); 'steps' are 2-5 short lines.",
  ].join("\n");

  const domains = ACTIVITY_DOMAINS.join("|");
  const schema = `{
  "theme": "short weekly theme, e.g. Water & Colours Week",
  "overview": "1-2 warm sentences for the parent about the week",
  "summerTips": ["short ${season} safety reminders (heat, sun, hydration)"],
  "days": [
    {
      "day": "Monday",
      "activities": [
        {
          "title": "short activity name",
          "setting": "indoor|outdoor|either",
          "domains": ["${domains}"],
          "description": "1 sentence on what it is",
          "steps": ["short how-to step", "..."],
          "materials": ["common household items"],
          "learningGoal": "the skill/growth this builds",
          "caregiverTip": "a way to extend or simplify it",
          "safetyNote": "choking/heat/sun/supervision note, or \"\" if nothing special",
          "durationMinutes": 15,
          "tags": ["quiet","messy","calming", "..."]
        }
      ]
    }
  ],
  "weekendIdeas": [ { ...same activity shape, but bigger weekend outings/projects } ]
}`;

  const user = [
    `Plan the upcoming ${season} week of play for this child.`,
    "",
    "CHILD:",
    childBrief(opts.child),
    "",
    opts.focuses?.length ? `FOCUS THESE SKILLS THIS WEEK: ${opts.focuses.join(", ")}` : "",
    opts.notes ? `EXTRA CONTEXT FROM PARENT: ${opts.notes}` : "",
    "",
    "Provide 7 days (Monday-Sunday), each with 2-3 activities, plus weekendIdeas.",
    "",
    "Respond with JSON matching exactly this shape:",
    schema,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

const SETTINGS = new Set<ActivitySetting>(["indoor", "outdoor", "either"]);
const VALID_DOMAINS = new Set<string>(ACTIVITY_DOMAINS);

function normalizeActivity(raw: any, id: string): ToddlerActivity | null {
  if (!raw || typeof raw.title !== "string") return null;
  const setting: ActivitySetting = SETTINGS.has(raw.setting) ? raw.setting : "either";
  const domains = Array.isArray(raw.domains)
    ? (raw.domains.filter((d: any) => VALID_DOMAINS.has(d)) as ActivityDomain[])
    : [];
  const steps = Array.isArray(raw.steps)
    ? raw.steps.map((s: any) => String(s).trim()).filter(Boolean)
    : [];
  const materials = Array.isArray(raw.materials)
    ? raw.materials.map((m: any) => String(m).trim()).filter(Boolean)
    : [];
  return {
    id,
    title: String(raw.title),
    setting,
    domains,
    description: String(raw.description ?? ""),
    steps,
    materials,
    learningGoal: String(raw.learningGoal ?? ""),
    caregiverTip: String(raw.caregiverTip ?? ""),
    safetyNote: String(raw.safetyNote ?? "").trim(),
    durationMinutes: Number.isFinite(raw.durationMinutes) ? Number(raw.durationMinutes) : 0,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  };
}

export async function generateToddlerPlan(opts: GenerateToddlerOptions): Promise<ToddlerPlan> {
  const start = opts.weekStartDate || weekStart();
  const season = opts.season || "summer";
  const { system, user } = buildPrompt(opts);

  const raw = await chat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    json: true,
    temperature: 0.8, // a little extra variety for creative play ideas
    maxTokens: 12000,
  });

  const parsed = parseJsonObject<{
    theme?: string;
    overview?: string;
    summerTips?: any[];
    days?: any[];
    weekendIdeas?: any[];
  }>(raw);

  const daysIn = Array.isArray(parsed.days) ? parsed.days : [];

  const days: ToddlerDay[] = DAY_NAMES.map((name, dayIdx) => {
    const match = daysIn.find(
      (d) =>
        typeof d?.day === "string" &&
        d.day.toLowerCase().startsWith(name.toLowerCase().slice(0, 3))
    );
    const actsRaw = Array.isArray(match?.activities) ? match.activities : [];
    const activities = actsRaw
      .map((a: any, i: number) => normalizeActivity(a, `d${dayIdx}-a${i}`))
      .filter((a: ToddlerActivity | null): a is ToddlerActivity => a !== null);
    return { day: name, date: addDays(start, dayIdx), activities };
  });

  const weekendIdeas = (Array.isArray(parsed.weekendIdeas) ? parsed.weekendIdeas : [])
    .map((a: any, i: number) => normalizeActivity(a, `we-${i}`))
    .filter((a: ToddlerActivity | null): a is ToddlerActivity => a !== null);

  if (days.every((d) => d.activities.length === 0) && weekendIdeas.length === 0) {
    throw new Error("The model returned no usable activities. Please try generating again.");
  }

  return {
    id: randomUUID(),
    weekStart: start,
    childId: opts.child.id,
    childName: opts.child.name,
    ageYears: opts.child.ageYears ?? 3,
    season,
    theme: String(parsed.theme ?? ""),
    overview: String(parsed.overview ?? ""),
    summerTips: Array.isArray(parsed.summerTips)
      ? parsed.summerTips.map((t: any) => String(t).trim()).filter(Boolean)
      : [],
    days,
    weekendIdeas,
    createdAt: new Date().toISOString(),
    model: defaultModel(),
  };
}
