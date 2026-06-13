import { GoogleGenerativeAI } from "@google/generative-ai"
import type { YardAnalysis, ScoreKey } from "@/lib/types"

const MODEL = "gemini-flash-latest"

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n)
  if (Number.isNaN(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

const SCORE_KEYS: ScoreKey[] = ["biodiversity", "pollinator", "sunlight", "soil", "food", "water"]

function buildPrompt(opts: { locationLabel?: string | null; climateZone?: string | null }) {
  const ctx = [
    opts.locationLabel ? `Location: ${opts.locationLabel}.` : null,
    opts.climateZone ? `Climate: ${opts.climateZone}.` : null,
  ]
    .filter(Boolean)
    .join(" ")

  return `You are an expert ecologist, permaculture designer, and native-plant specialist analyzing a photo of someone's yard, garden, balcony, or outdoor space.
${ctx ? `\nContext about this location: ${ctx} Tailor native plant and wildlife suggestions to this region and climate.\n` : ""}
Assess the space for its ecological and regenerative potential. Be encouraging and constructive — this is a hopeful, solarpunk community. Even a bare lawn or concrete patio has potential.

Return ONLY valid JSON (no markdown, no code fences) with exactly this shape:
{
  "summary": "2-3 warm, specific sentences about what you see and its regenerative potential",
  "scores": {
    "biodiversity": 0-100,
    "pollinator": 0-100,
    "sunlight": 0-100,
    "soil": 0-100,
    "food": 0-100,
    "water": 0-100
  },
  "observations": ["3-5 specific things you notice in the photo"],
  "recommendations": ["4-6 concrete, actionable regenerative actions, ordered by impact"],
  "plants": [
    { "name": "Common name", "reason": "why it helps here", "native": true }
  ],
  "wildlife": ["3-5 birds, insects, or other species this space could attract or support"],
  "climateZone": "best guess at climate/growing zone or null"
}
Provide 4-6 plant recommendations appropriate to the climate, prioritizing natives. Scores should be honest but generous about potential.`
}

export async function analyzeYard(opts: {
  imageBase64: string
  mimeType: string
  locationLabel?: string | null
  climateZone?: string | null
}): Promise<YardAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: "application/json" },
  })

  const result = await model.generateContent([
    buildPrompt(opts),
    { inlineData: { data: opts.imageBase64, mimeType: opts.mimeType } },
  ])

  const text = result.response.text()
  const jsonText = text.replace(/```json|```/g, "").trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    const match = jsonText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("Could not parse analysis response")
    parsed = JSON.parse(match[0])
  }

  const rawScores = (parsed.scores ?? {}) as Record<string, unknown>
  const scores = {} as YardAnalysis["scores"]
  for (const key of SCORE_KEYS) {
    scores[key] = clampScore(rawScores[key])
  }

  const regenScore = Math.round(
    SCORE_KEYS.reduce((sum, k) => sum + scores[k], 0) / SCORE_KEYS.length,
  )

  return {
    summary: String(parsed.summary ?? "A space with regenerative potential."),
    regenScore,
    scores,
    observations: toStringArray(parsed.observations),
    recommendations: toStringArray(parsed.recommendations),
    plants: Array.isArray(parsed.plants)
      ? (parsed.plants as Record<string, unknown>[]).slice(0, 8).map((p) => ({
          name: String(p.name ?? "Plant"),
          reason: String(p.reason ?? ""),
          native: Boolean(p.native),
        }))
      : [],
    wildlife: toStringArray(parsed.wildlife),
    climateZone: opts.climateZone ?? (parsed.climateZone ? String(parsed.climateZone) : null),
  }
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x)).filter(Boolean).slice(0, 8)
}
