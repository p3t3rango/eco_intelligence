export type ScoreKey =
  | "biodiversity"
  | "pollinator"
  | "sunlight"
  | "soil"
  | "food"
  | "water"

export interface PlantRecommendation {
  name: string
  reason: string
  native: boolean
  /** Which of the user's goals this plant primarily serves. */
  goal?: GoalKey
  /** Real photo of the species (from iNaturalist), filled in after planning. */
  imageUrl?: string | null
  imageAttribution?: string | null
}

// --- Goals -----------------------------------------------------------------
// The combo of outcomes a grower wants. Chosen AFTER the Read so they're
// informed by what's actually in the yard.

export type GoalKey =
  | "food"
  | "medicine"
  | "pollinators"
  | "natives"
  | "beauty"
  | "lowEffort"
  | "climate"
  | "localHelp"

export const GOALS: { key: GoalKey; label: string; blurb: string; emoji: string }[] = [
  { key: "food", label: "Food & harvest", blurb: "Edible, productive plants", emoji: "🥕" },
  { key: "medicine", label: "Medicine & healing", blurb: "Medicinal & tea herbs", emoji: "🌿" },
  { key: "pollinators", label: "Pollinators & wildlife", blurb: "Feed bees, butterflies & birds", emoji: "🐝" },
  { key: "natives", label: "Native restoration", blurb: "Bring back what belongs here", emoji: "🌾" },
  { key: "beauty", label: "Beauty & calm", blurb: "A space that feels good", emoji: "🌸" },
  { key: "lowEffort", label: "Low effort", blurb: "Thrives with little upkeep", emoji: "😌" },
  { key: "climate", label: "Climate resilience", blurb: "Drought & water-wise", emoji: "☀️" },
  { key: "localHelp", label: "Help a local species", blurb: "Aid species in trouble near you", emoji: "🦋" },
]

// --- The Read --------------------------------------------------------------
// "Here's what we see" — understanding before any plan.

export interface YardReading {
  summary: string
  regenScore: number
  scores: Record<ScoreKey, number>
  observations: string[]
  /** Plants/features the AI can identify in the photo. */
  detected: string[]
  /** Birds, insects, etc. the space could support. */
  wildlife: string[]
  climateZone: string | null
}

// --- The Plan --------------------------------------------------------------
// Goal-tailored, place-grounded recommendations.

export interface GroundedRecommendation {
  title: string
  /** The place-grounded "why this matters here". */
  why: string
  /** Which goal this serves. */
  goal: GoalKey
  effort?: "low" | "medium" | "high"
  impact?: "low" | "medium" | "high"
}

export interface LocalAction {
  /** A local ecological problem and how this yard can help. */
  problem: string
  action: string
  species?: string
}

export interface YardPlan {
  recommendations: GroundedRecommendation[]
  plants: PlantRecommendation[]
  localActions: LocalAction[]
}

// --- Visualization (Phase 3) -----------------------------------------------

/** A marker on the planting map: where to plant what, and why, over the photo. */
export interface PlantingMarker {
  /** position as a percentage of the photo (0-100). */
  x: number
  y: number
  plant: string
  why: string
}

export interface YardLayout {
  markers: PlantingMarker[]
}

// Full record stored in posts.analysis (jsonb). `plan`/`goals` are filled in
// after the grower picks goals; reading is available immediately.
export interface YardAnalysis {
  summary: string
  regenScore: number
  scores: Record<ScoreKey, number>
  observations: string[]
  /** legacy flat recs (kept for older posts); new posts use plan.recommendations */
  recommendations: string[]
  plants: PlantRecommendation[]
  wildlife: string[]
  climateZone: string | null
  // Phase 2 additions
  detected?: string[]
  goals?: GoalKey[]
  plan?: YardPlan
}

export interface GeoResult {
  lat: number
  lng: number
  locationLabel: string
  climateZone: string | null
}

export const SCORE_META: { key: ScoreKey; label: string; description: string }[] = [
  { key: "biodiversity", label: "Biodiversity", description: "Variety of plant & animal life" },
  { key: "pollinator", label: "Pollinators", description: "Friendliness to bees & butterflies" },
  { key: "sunlight", label: "Sunlight", description: "Solar exposure for growing" },
  { key: "soil", label: "Soil Health", description: "Living, covered, fertile ground" },
  { key: "food", label: "Food Production", description: "Edible & productive plants" },
  { key: "water", label: "Water Wisdom", description: "Retention & drought resilience" },
]
