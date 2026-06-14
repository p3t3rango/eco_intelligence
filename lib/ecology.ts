// Local-ecology context from FREE, no-API-key sources, used to ground AI yard
// recommendations in a specific place ("why this matters HERE").
//
// Primary source: iNaturalist `observations/species_counts` — real research-grade
// observations near a lat/lng, with conservation status. No key required.
// The function NEVER throws: on any failure it returns empty arrays so callers
// can degrade gracefully.

export interface LocalSpecies {
  commonName: string
  scientificName: string
  group: "bird" | "insect" | "pollinator" | "plant" | "mammal" | "amphibian" | "other"
  threatened: boolean
  observations: number
}

export interface LocalContext {
  nearbyPollinators: LocalSpecies[]
  nearbyBirds: LocalSpecies[]
  nativePlants: LocalSpecies[]
  threatened: LocalSpecies[]
  sources: string[]
}

const EMPTY: LocalContext = {
  nearbyPollinators: [],
  nearbyBirds: [],
  nativePlants: [],
  threatened: [],
  sources: [],
}

const INAT = "https://api.inaturalist.org/v1/observations/species_counts"

type INatResult = {
  count: number
  taxon?: {
    name?: string
    preferred_common_name?: string
    iconic_taxon_name?: string
    conservation_status?: { status?: string; status_name?: string } | null
  }
}

function groupFor(iconic: string | undefined, asPollinator: boolean): LocalSpecies["group"] {
  switch (iconic) {
    case "Aves":
      return "bird"
    case "Insecta":
      return asPollinator ? "pollinator" : "insect"
    case "Plantae":
      return "plant"
    case "Mammalia":
      return "mammal"
    case "Amphibia":
      return "amphibian"
    default:
      return "other"
  }
}

async function fetchCounts(
  params: Record<string, string>,
  asPollinator = false,
): Promise<LocalSpecies[]> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  try {
    const qs = new URLSearchParams({ quality_grade: "research", per_page: "100", ...params })
    const res = await fetch(`${INAT}?${qs}`, { cache: "no-store", signal: ctrl.signal })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: INatResult[] }
    const seen = new Set<string>()
    const out: LocalSpecies[] = []
    for (const r of data.results ?? []) {
      const t = r.taxon
      const sci = t?.name
      if (!sci || seen.has(sci)) continue
      seen.add(sci)
      out.push({
        commonName: t?.preferred_common_name || sci,
        scientificName: sci,
        group: groupFor(t?.iconic_taxon_name, asPollinator),
        threatened: !!t?.conservation_status,
        observations: r.count ?? 0,
      })
    }
    return out.sort((a, b) => b.observations - a.observations).slice(0, 8)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch local ecological context near a coordinate. Runs the category queries
 * concurrently and tolerates partial failure.
 */
export async function getLocalEcology(lat: number, lng: number): Promise<LocalContext> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return EMPTY
  const base = { lat: String(lat), lng: String(lng), radius: "50" }

  const [pollinators, birds, plants, threatened] = await Promise.all([
    fetchCounts({ ...base, iconic_taxa: "Insecta" }, true),
    fetchCounts({ ...base, iconic_taxa: "Aves" }),
    fetchCounts({ ...base, iconic_taxa: "Plantae" }),
    fetchCounts({ ...base, threatened: "true" }),
  ])

  const sources: string[] = []
  if (pollinators.length || birds.length || plants.length || threatened.length) {
    sources.push("iNaturalist")
  }

  return {
    nearbyPollinators: pollinators,
    nearbyBirds: birds,
    nativePlants: plants,
    threatened,
    sources,
  }
}

export interface PlantImage {
  imageUrl: string
  attribution: string
}

const INAT_TAXA = "https://api.inaturalist.org/v1/taxa"

async function taxaPhoto(query: string): Promise<PlantImage | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 5000)
  try {
    const qs = new URLSearchParams({ q: query, rank: "species,genus", per_page: "1" })
    const res = await fetch(`${INAT_TAXA}?${qs}`, { cache: "force-cache", signal: ctrl.signal })
    if (!res.ok) return null
    const data = (await res.json()) as {
      results?: { default_photo?: { medium_url?: string; attribution?: string } }[]
    }
    const photo = data.results?.[0]?.default_photo
    if (!photo?.medium_url) return null
    return { imageUrl: photo.medium_url, attribution: photo.attribution ?? "iNaturalist" }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Look up a real photo for a plant by name. The AI often returns names like
 * "Narrow-leaf Milkweed (Asclepias fascicularis)"; the scientific name in
 * parentheses is the most reliable iNaturalist query, so we try that first,
 * then fall back to the cleaned common name.
 */
export async function getPlantImage(name: string): Promise<PlantImage | null> {
  const sci = name.match(/\(([^)]+)\)/)?.[1]?.trim()
  const common = name.replace(/\([^)]*\)/g, "").trim()
  for (const q of [sci, common, name].filter((v): v is string => !!v)) {
    const hit = await taxaPhoto(q)
    if (hit) return hit
  }
  return null
}

/** Fetch photos for several plant names concurrently (best-effort). */
export async function getPlantImages(names: string[]): Promise<Record<string, PlantImage>> {
  const entries = await Promise.all(
    names.map(async (n) => [n, await getPlantImage(n)] as const),
  )
  const map: Record<string, PlantImage> = {}
  for (const [name, img] of entries) if (img) map[name] = img
  return map
}

/** Compact, prompt-friendly summary of local ecology for the AI. */
export function summarizeLocalContext(ctx: LocalContext): string {
  if (!ctx.sources.length) return ""
  const list = (species: LocalSpecies[]) =>
    species
      .slice(0, 6)
      .map((s) => (s.commonName === s.scientificName ? s.commonName : `${s.commonName} (${s.scientificName})`))
      .join(", ")

  const lines: string[] = []
  if (ctx.nearbyPollinators.length) lines.push(`Pollinators/insects seen nearby: ${list(ctx.nearbyPollinators)}.`)
  if (ctx.nearbyBirds.length) lines.push(`Birds seen nearby: ${list(ctx.nearbyBirds)}.`)
  if (ctx.nativePlants.length) lines.push(`Plants observed locally: ${list(ctx.nativePlants)}.`)
  if (ctx.threatened.length) lines.push(`Species of conservation concern observed near here: ${list(ctx.threatened)}.`)
  lines.push(`(Source: ${ctx.sources.join(", ")} — real observations within ~50km.)`)
  return lines.join("\n")
}
