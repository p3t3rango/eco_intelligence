# Ecological Intelligence

A private-first companion that helps you **understand your land, choose what you want it to become, and get a place-grounded plan to make it more alive.**

Photograph your yard → get an honest ecological **Read** → pick your **Goals** → receive a **Plan** with recommendations and plant picks whose reasons are grounded in your actual location, plus an AI **visualization** of your yard transformed.

## How it works

```
Capture → The Read → Your Goals → The Plan (+ visualization)
```

- **The Read** — Gemini analyzes the photo: a summary, six ecological scores, what it can identify, and the wildlife the space could support. You can correct anything it got wrong.
- **Your Goals** — pick a combo (food, medicine & healing, pollinators & wildlife, native restoration, beauty, low-effort, climate resilience, help a local species).
- **The Plan** — recommendations and plant picks tailored to your goals, each with a *"why it matters here"* grounded in **real nearby species** (via iNaturalist) and your climate. Plant cards show real photos; an action plan tracks your progress.
- **Visualization** — Gemini re-renders your photo with the plants grown in ("Transformed"), or overlays an interactive **planting map** of where to plant what.

## Stack

- **Next.js 16** (App Router, Turbopack) · React 19 · Tailwind v4
- **Postgres** via **Drizzle ORM**
- **better-auth** (email + password)
- **Gemini** (`gemini-2.5-flash` for analysis, `gemini-2.5-flash-image` for renders) via the Vercel AI SDK
- **iNaturalist** API for local species + plant photos (free, no key) — `lib/ecology.ts`
- **Vercel Blob** for photo storage (local filesystem fallback in dev)

## Local development

Requires Node 20+ and a local Postgres (or any Postgres connection string).

```bash
npm install

# Create a local database
createdb eco_intelligence

# Configure env (see below), then push the schema
DATABASE_URL='postgresql://USER@localhost:5432/eco_intelligence' npx drizzle-kit push

npm run dev   # http://localhost:3000
```

### Environment (`.env.local`)

```bash
DATABASE_URL=postgresql://USER@localhost:5432/eco_intelligence
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<random base64 string>

# AI analysis + image generation — https://aistudio.google.com/apikey
GEMINI_API_KEY=

# Optional: nicer location labels & climate (falls back to a latitude guess)
GOOGLE_MAPS_API_KEY=

# Optional: Vercel Blob. Leave blank in dev to store photos in public/uploads.
BLOB_READ_WRITE_TOKEN=
```

Phone photos (HEIC) are converted to JPEG and downscaled in the browser before upload.

## Project layout

- `app/` — routes (`grow` = the wizard, `post/[id]` = a yard, `community`, `leaderboard`, `profile`)
- `app/actions/posts.ts` — server actions: `createReading`, `generatePlan`, `generateVisualization`
- `lib/analyze.ts` — `readYard()` (the Read) and `planYard()` (goal-tailored, grounded plan)
- `lib/ecology.ts` — iNaturalist local species + plant photos
- `lib/visualize.ts` — Gemini render + planting-map placement
- `lib/db/schema.ts` — Drizzle schema
- `components/` — UI (design tokens live in `app/globals.css`)

## Design

A neutral base with a single green accent and solarpunk touches (botanical line-art, growth-as-data, serif headings). Light/dark toggle in the nav. All colors are CSS tokens in `app/globals.css`, so palette changes are a one-file edit.
