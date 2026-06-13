"use server"

import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { getSession, getUserId } from "@/lib/session"
import { geocodePlace } from "@/lib/geo"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

function slugifyHandle(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "gardener"
  )
}

export async function ensureProfile() {
  const session = await getSession()
  if (!session?.user) return null

  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id)).limit(1)
  if (existing) return existing

  const baseHandle = slugifyHandle(session.user.name || session.user.email.split("@")[0])
  const handle = `${baseHandle}${Math.floor(Math.random() * 9000 + 1000)}`

  const [created] = await db
    .insert(profiles)
    .values({
      userId: session.user.id,
      displayName: session.user.name || "New Gardener",
      handle,
    })
    .onConflictDoNothing()
    .returning()

  if (created) return created

  // Another concurrent request created it first; fetch the winner.
  const [winner] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id)).limit(1)
  return winner ?? null
}

export async function updateProfile(formData: FormData) {
  const userId = await getUserId()
  const displayName = String(formData.get("displayName") || "").trim()
  const bio = String(formData.get("bio") || "").trim()
  const locationLabel = String(formData.get("locationLabel") || "").trim()

  let lat: string | null = null
  let lng: string | null = null
  let climateZone: string | null = null

  if (locationLabel) {
    const geo = await geocodePlace(locationLabel)
    if (geo) {
      lat = String(geo.lat)
      lng = String(geo.lng)
      climateZone = geo.climateZone
    }
  }

  await db
    .update(profiles)
    .set({
      displayName: displayName || "New Gardener",
      bio: bio || null,
      locationLabel: locationLabel || null,
      ...(lat ? { lat, lng, climateZone } : {}),
    })
    .where(eq(profiles.userId, userId))

  revalidatePath("/profile")
  revalidatePath("/settings")
}
