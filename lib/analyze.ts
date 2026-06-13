import { generateText, Output } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import type { YardAnalysis, ScoreKey } from "@/lib/types"

// Prefer the user's own Gemini API key when it's available (used in production /
// once the key is present in the environment). Otherwise fall back to the same
// Gemini model through the Vercel AI Gateway, which is configured zero-config here.
function resolveModel() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey })
    return google("gemini-2.5-flash")
  }
  // Gateway model string (authenticated via AI_GATEWAY_API_KEY).
  return "google/gemini-2.5-flash"
}

const SCORE_KEYS: ScoreKey[] = ["biodiversity", "pollinator", "sunlight", "soil", "food", "water"]

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n)
  if (Number.isNaN(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

const analysisSchema = z.object({
  summary: z.string().describe("2-3 warm, specific sentences about what you see and its regenerative potential"),
  scores: z.object({
    biodiversity: z.number().describe("0-100 variety of plant & animal life"),
    pollinator: z.number().describe("0-100 friendliness to bees & butterflies"),
    sunlight: z.number().describe("0-100 solar exposure for growing"),
    soil: z.number().describe("0-100 living, covered, fertile ground"),
    food: z.number().describe("0-100 edible & productive plants"),
    water: z.number().describe("0-100 water retention & drought resilience"),
  }),
  observations: z.array(z.string()).describe("3-5 specific things you notice in the photo"),
  recommendations: z
    .array(z.string())
    .describe("4-6 concrete, actionable regenerative actions, ordered by impact"),
  plants: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string().describe("why it helps here"),
        native: z.boolean(),
      }),
    )
    .describe("4-6 plant recommendations appropriate to the climate, prioritizing natives"),
  wildlife: z
    .array(z.string())
    .describe("3-5 birds, insects, or other species this space could attract or support"),
  climateZone: z.string().nullable().describe("best guess at climate/growing zone or null"),
})

function buildPrompt(opts: { locationLabel?: string | null; climateZone?: string | null }) {
  const ctx = [
    opts.locationLabel ? `Location: ${opts.locationLabel}.` : null,
    opts.climateZone ? `Climate: ${opts.climateZone}.` : null,
  ]
    .filter(Boolean)
    .join(" ")

  return `You are an expert ecologist, permaculture designer, and native-plant specialist analyzing a photo of someone's yard, garden, balcony, or outdoor space.
${ctx ? `\nContext about this location: ${ctx} Tailor native plant and wildlife suggestions to this region and climate.\n` : ""}
Assess the space for its ecological and regenerative potential. Be encouraging and constructive — this is a hopeful, solarpunk community. Even a bare lawn or concrete patio has potential. Prioritize native plants. Scores should be honest but generous about potential.`
}

export async function analyzeYard(opts: {
  imageBase64: string
  mimeType: string
  locationLabel?: string | null
  climateZone?: string | null
}): Promise<YardAnalysis> {
  const { experimental_output: parsed } = await generateText({
    model: resolveModel(),
    output: Output.object({ schema: analysisSchema }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildPrompt(opts) },
          { type: "image", image: `data:${opts.mimeType};base64,${opts.imageBase64}` },
        ],
      },
    ],
  })

  const scores = {} as YardAnalysis["scores"]
  for (const key of SCORE_KEYS) {
    scores[key] = clampScore(parsed.scores[key])
  }

  const regenScore = Math.round(SCORE_KEYS.reduce((sum, k) => sum + scores[k], 0) / SCORE_KEYS.length)

  return {
    summary: parsed.summary || "A space with regenerative potential.",
    regenScore,
    scores,
    observations: (parsed.observations ?? []).map(String).filter(Boolean).slice(0, 8),
    recommendations: (parsed.recommendations ?? []).map(String).filter(Boolean).slice(0, 8),
    plants: (parsed.plants ?? []).slice(0, 8).map((p) => ({
      name: String(p.name ?? "Plant"),
      reason: String(p.reason ?? ""),
      native: Boolean(p.native),
    })),
    wildlife: (parsed.wildlife ?? []).map(String).filter(Boolean).slice(0, 8),
    climateZone: opts.climateZone ?? (parsed.climateZone ? String(parsed.climateZone) : null),
  }
}
