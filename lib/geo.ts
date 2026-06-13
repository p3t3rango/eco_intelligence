import type { GeoResult } from "@/lib/types"

const KEY = process.env.GOOGLE_MAPS_API_KEY

/**
 * Rough Köppen-ish climate descriptor derived from latitude. Used as a
 * lightweight, dependency-free hint to ground native-plant recommendations.
 */
function climateFromLat(lat: number): string {
  const a = Math.abs(lat)
  if (a < 10) return "Tropical (hot & humid year-round)"
  if (a < 23.5) return "Subtropical (warm, mild winters)"
  if (a < 35) return "Warm temperate / Mediterranean"
  if (a < 50) return "Temperate (four distinct seasons)"
  if (a < 60) return "Cool temperate / boreal"
  return "Subpolar (short growing season)"
}

/** Reverse geocode raw coordinates into a human label + climate hint. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  const fallback: GeoResult = {
    lat,
    lng,
    locationLabel: `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
    climateZone: climateFromLat(lat),
  }
  if (!KEY) return fallback
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_1|country&key=${KEY}`,
      { cache: "no-store" },
    )
    const data = await res.json()
    const label = data?.results?.[0]?.formatted_address as string | undefined
    return {
      lat,
      lng,
      locationLabel: label ?? fallback.locationLabel,
      climateZone: climateFromLat(lat),
    }
  } catch {
    return fallback
  }
}

/** Forward geocode a typed place name (e.g. "Portland, OR") into coordinates. */
export async function geocodePlace(place: string): Promise<GeoResult | null> {
  if (!KEY) return null
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${KEY}`,
      { cache: "no-store" },
    )
    const data = await res.json()
    const result = data?.results?.[0]
    if (!result) return null
    const lat = result.geometry.location.lat as number
    const lng = result.geometry.location.lng as number
    return {
      lat,
      lng,
      locationLabel: result.formatted_address as string,
      climateZone: climateFromLat(lat),
    }
  } catch {
    return null
  }
}
