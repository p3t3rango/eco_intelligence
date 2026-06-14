import { generateText, Output } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import type { YardReading, YardPlan, ScoreKey, GoalKey } from "@/lib/types"
import { GOALS } from "@/lib/types"
import type { LocalContext } from "@/lib/ecology"
import { summarizeLocalContext } from "@/lib/ecology"

// Prefer the user's own Gemini API key when present; otherwise fall back to the
// same model via the Vercel AI Gateway (zero-config).
function resolveModel() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey })
    return google("gemini-2.5-flash")
  }
  return "google/gemini-2.5-flash"
}

const SCORE_KEYS: ScoreKey[] = ["biodiversity", "pollinator", "sunlight", "soil", "food", "water"]

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n)
  if (Number.isNaN(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

// ── The Read ────────────────────────────────────────────────────────────────

const readingSchema = z.object({
  summary: z.string().describe("2-3 warm, specific sentences about what you actually see in this space"),
  scores: z.object({
    biodiversity: z.number().describe("0-100 variety of plant & animal life"),
    pollinator: z.number().describe("0-100 friendliness to bees & butterflies"),
    sunlight: z.number().describe("0-100 solar exposure for growing"),
    soil: z.number().describe("0-100 living, covered, fertile ground"),
    food: z.number().describe("0-100 edible & productive plants"),
    water: z.number().describe("0-100 water retention & drought resilience"),
  }),
  observations: z.array(z.string()).describe("3-5 specific things you notice in the photo"),
  detected: z
    .array(z.string())
    .describe("plants, structures, and features you can identify in the photo (e.g. 'mowed lawn', 'wood fence', 'oak tree')"),
  wildlife: z.array(z.string()).describe("3-5 birds, insects, or other species this space could attract or support"),
  climateZone: z.string().nullable().describe("best guess at climate/growing zone or null"),
})

function readPrompt(opts: { locationLabel?: string | null; climateZone?: string | null }) {
  const ctx = [
    opts.locationLabel ? `Location: ${opts.locationLabel}.` : null,
    opts.climateZone ? `Climate: ${opts.climateZone}.` : null,
  ]
    .filter(Boolean)
    .join(" ")

  return `You are an expert ecologist and naturalist doing a READING of a photo of someone's yard, garden, balcony, or outdoor space. This is the "here's what we see" step — help the person UNDERSTAND their land. Do NOT give recommendations or an action plan yet.
${ctx ? `\nContext: ${ctx} Tailor your read to this region and climate.\n` : ""}
Describe what's actually there, identify what you can, and score its current ecological state honestly but with an eye for potential. Be warm and encouraging — even a bare lawn has potential.`
}

export async function readYard(opts: {
  imageBase64: string
  mimeType: string
  locationLabel?: string | null
  climateZone?: string | null
}): Promise<YardReading> {
  const { experimental_output: parsed } = await generateText({
    model: resolveModel(),
    output: Output.object({ schema: readingSchema }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: readPrompt(opts) },
          { type: "image", image: `data:${opts.mimeType};base64,${opts.imageBase64}` },
        ],
      },
    ],
  })

  const scores = {} as YardReading["scores"]
  for (const key of SCORE_KEYS) scores[key] = clampScore(parsed.scores[key])
  const regenScore = Math.round(SCORE_KEYS.reduce((sum, k) => sum + scores[k], 0) / SCORE_KEYS.length)

  return {
    summary: parsed.summary || "A space with regenerative potential.",
    regenScore,
    scores,
    observations: (parsed.observations ?? []).map(String).filter(Boolean).slice(0, 8),
    detected: (parsed.detected ?? []).map(String).filter(Boolean).slice(0, 12),
    wildlife: (parsed.wildlife ?? []).map(String).filter(Boolean).slice(0, 8),
    climateZone: opts.climateZone ?? (parsed.climateZone ? String(parsed.climateZone) : null),
  }
}

// ── The Plan ─────────────────────────────────────────────────────────────────

const GOAL_KEYS = GOALS.map((g) => g.key) as [GoalKey, ...GoalKey[]]

const planSchema = z.object({
  recommendations: z
    .array(
      z.object({
        title: z.string().describe("a concrete, actionable step"),
        why: z.string().describe("WHY this matters specifically HERE — tie to this location, climate, the goals, and the local species data provided"),
        goal: z.enum(GOAL_KEYS).describe("which of the chosen goals this serves"),
        effort: z.enum(["low", "medium", "high"]).nullable(),
        impact: z.enum(["low", "medium", "high"]).nullable(),
      }),
    )
    .describe("5-8 recommendations, each tied to a chosen goal, ordered by impact"),
  plants: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string().describe("why it fits here and which goal it serves"),
        native: z.boolean(),
        goal: z.enum(GOAL_KEYS),
      }),
    )
    .describe("5-8 plant picks appropriate to the climate and goals, prioritizing natives and the local species observed"),
  localActions: z
    .array(
      z.object({
        problem: z.string().describe("a real local ecological problem (e.g. declining native bees, a struggling local species)"),
        action: z.string().describe("how THIS yard can concretely help with that problem"),
        species: z.string().nullable().describe("the species involved, if specific"),
      }),
    )
    .describe("1-3 ways this yard can help a local ecological problem, grounded in the local species data"),
})

function planPrompt(opts: {
  reading: YardReading
  goals: GoalKey[]
  locationLabel?: string | null
  climateZone?: string | null
  localSummary: string
}) {
  const goalLabels = opts.goals
    .map((k) => GOALS.find((g) => g.key === k)?.label ?? k)
    .join(", ")
  const ctx = [
    opts.locationLabel ? `Location: ${opts.locationLabel}.` : null,
    opts.climateZone ? `Climate: ${opts.climateZone}.` : null,
  ]
    .filter(Boolean)
    .join(" ")

  return `You are an expert permaculture designer and native-plant specialist building a personalized plan for someone's yard.

THE READ (what's already there):
${opts.reading.summary}
Notable features: ${opts.reading.detected.join(", ") || "n/a"}.

${ctx ? `PLACE: ${ctx}\n` : ""}${
    opts.localSummary
      ? `REAL LOCAL ECOLOGY (use this to make every "why" specific to this place):\n${opts.localSummary}\n`
      : ""
  }
THE PERSON'S GOALS: ${goalLabels}.

Build a plan that serves THESE goals. Critically: every recommendation and plant must include a "why" that is grounded in THIS place — the climate, the region, and especially the real local species data above. If a local species is in trouble, suggest how this yard can help it. Prioritize native plants and the species actually observed nearby. Be specific, warm, and practical — no generic advice.`
}

export async function planYard(opts: {
  reading: YardReading
  goals: GoalKey[]
  localContext: LocalContext
  locationLabel?: string | null
  climateZone?: string | null
}): Promise<YardPlan> {
  const localSummary = summarizeLocalContext(opts.localContext)

  const { experimental_output: parsed } = await generateText({
    model: resolveModel(),
    output: Output.object({ schema: planSchema }),
    messages: [
      { role: "user", content: planPrompt({ ...opts, localSummary }) },
    ],
  })

  return {
    recommendations: (parsed.recommendations ?? []).slice(0, 10).map((r) => ({
      title: String(r.title ?? ""),
      why: String(r.why ?? ""),
      goal: r.goal,
      effort: r.effort ?? undefined,
      impact: r.impact ?? undefined,
    })),
    plants: (parsed.plants ?? []).slice(0, 10).map((p) => ({
      name: String(p.name ?? "Plant"),
      reason: String(p.reason ?? ""),
      native: Boolean(p.native),
      goal: p.goal,
    })),
    localActions: (parsed.localActions ?? []).slice(0, 4).map((a) => ({
      problem: String(a.problem ?? ""),
      action: String(a.action ?? ""),
      species: a.species ?? undefined,
    })),
  }
}
