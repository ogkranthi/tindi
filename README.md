# 🌿 Tindi

A long-term, low-maintenance **AI health & food companion for our family** — lighter and
more health-focused than [ollie.ai](https://ollie.ai/), built around *our* people: their
conditions, their cuisines, and the time we actually have.

It plans the week, builds the grocery list, and (next) tracks healthy habits with streaks
and turns Whoop data into insights — all powered by models via **OpenRouter**.

## Who it plans for

| Member | Context that shapes every plan |
| --- | --- |
| **Dad** | Hypothyroid · plays cricket on weekends · Whoop · software dev |
| **Mom** | Prediabetic · overweight · ~4 months pregnant · Whoop · software dev |
| **Toddler (3)** | Picky eater · finger-friendly, mild, safe portions |

Cuisines: **Indian · Mediterranean · Mexican · American.** Staples: fish, chicken, mutton,
nuts, seeds. Weekly per-person targets (servings): 5 veg · 4 fruit · 3 protein · 2 grains · 1 treat.

## Tech (chosen for minimum maintenance)

- **Next.js 15** (App Router) — one app for UI + API, deploy anywhere.
- **SQLite** via `better-sqlite3` — a single file at `data/tindi.db`. No external database to run.
- **OpenRouter** — all model calls in one place (`src/lib/openrouter.ts`); swap models via env.
- **Tailwind CSS** — styling with no design system to maintain.

## Setup

```bash
npm install
cp .env.example .env.local      # add your OPENROUTER_API_KEY
npm run dev                     # http://localhost:3000
```

On first run the family is seeded into SQLite from `src/lib/family.ts`. Edit profiles anytime
on the **Family** page — the next meal plan uses the new context.

### Environment

| Var | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Required for AI features. |
| `OPENROUTER_MODEL` | Model slug (default `anthropic/claude-sonnet-4.6`). |
| `TINDI_DB_PATH` | SQLite file location (default `./data/tindi.db`). |

## What works today

- **AI meal plan** — a 7-day plan tailored to each member's health profile, with explicit
  per-person tweaks, prep time, and category tags. Safety rules (pregnancy mercury/raw-food,
  prediabetic low-GI, thyroid goitrogens, toddler choking) are enforced in the prompt.
- **Grocery list** — auto-aggregated and deduplicated from the plan, grouped by aisle, with
  check-off that persists.
- **Family profiles** — editable context that drives the AI.

## Roadmap

1. **Tracking + streaks** — log food against weekly targets per person; streaks to build habits.
   (DB table `food_logs` already exists.)
2. **Insights** — connect Dad & Mom's **Whoop** (recovery, sleep, strain) and let the AI relate
   food/activity to how they feel; weekend cricket / walking factored in.
3. **Recommendations** — proactive nudges ("Mom's iron is low this week", "add a selenium snack
   for Dad").
4. **Time-savers** — leftover-aware planning, pantry memory, one-tap re-plan.

## Project layout

```
src/
  app/                 # routes (pages + /api handlers)
  components/          # client components (generate, grocery, family editor)
  lib/
    db.ts              # SQLite connection, schema, queries
    family.ts          # seeded family profiles
    openrouter.ts      # the only place that calls models
    mealplan.ts        # prompt construction + plan normalization
    grocery.ts         # ingredient aggregation
    types.ts           # domain types
```
