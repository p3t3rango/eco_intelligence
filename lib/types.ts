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
}

export interface YardAnalysis {
  summary: string
  regenScore: number
  scores: Record<ScoreKey, number>
  observations: string[]
  recommendations: string[]
  plants: PlantRecommendation[]
  wildlife: string[]
  climateZone: string | null
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
