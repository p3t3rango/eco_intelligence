"use server"

import { db } from "@/lib/db"
import { posts, profiles, yardTasks } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { readYard, planYard } from "@/lib/analyze"
import { getLocalEcology, getPlantImages } from "@/lib/ecology"
import { geocodePlace } from "@/lib/geo"
import { storeYardImage } from "@/lib/blob"
import { renderTransformed, planLayout } from "@/lib/visualize"
import type { GoalKey, YardAnalysis, YardReading, PlantingMarker } from "@/lib/types"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type CreateReadingResult =
  | { ok: true; postId: number; reading: YardReading }
  | { ok: false; error: string }

/**
 * Step 1 — "The Read". Upload the photo, resolve location, run the ecological
 * reading (no plan yet), and save a draft post the grower can then set goals on.
 */
export async function createReading(formData: FormData): Promise<CreateReadingResult> {
  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return { ok: false, error: "You must be signed in to analyze a yard." }
  }

  const file = formData.get("image") as File | null
  const title = String(formData.get("title") || "").trim()
  const caption = String(formData.get("caption") || "").trim()
  const locationLabel = String(formData.get("locationLabel") || "").trim()

  if (!file || file.size === 0) {
    return { ok: false, error: "Please add a photo of your yard or garden." }
  }

  // Resolve location/climate (fall back to the user's profile location).
  let lat: string | null = null
  let lng: string | null = null
  let climateZone: string | null = null
  let resolvedLocation = locationLabel

  if (locationLabel) {
    const geo = await geocodePlace(locationLabel)
    if (geo) {
      lat = String(geo.lat)
      lng = String(geo.lng)
      climateZone = geo.climateZone
      // Prefer the friendly geocoded place name (e.g. "Richmond, VA") over a
      // raw ZIP the user may have typed.
      if (geo.locationLabel) resolvedLocation = geo.locationLabel
    }
  }

  if (!climateZone) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)
    if (profile?.climateZone) {
      climateZone = profile.climateZone
      lat = lat ?? profile.lat
      lng = lng ?? profile.lng
      if (!resolvedLocation && profile.locationLabel) resolvedLocation = profile.locationLabel
    }
  }

  // Store the image (Vercel Blob in prod, local filesystem fallback in dev).
  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg")
  let blob
  try {
    blob = await storeYardImage(`${userId}/${Date.now()}.${ext}`, bytes, file.type || "image/jpeg")
  } catch (err) {
    console.log("[ecointelli] image storage failed:", err instanceof Error ? err.message : err)
    return { ok: false, error: "We couldn't save that photo. Please try again." }
  }

  // Run the ecological reading.
  let reading: YardReading
  try {
    reading = await readYard({
      imageBase64: bytes.toString("base64"),
      mimeType: file.type || "image/jpeg",
      climateZone,
      locationLabel: resolvedLocation,
    })
  } catch (err) {
    console.log("[ecointelli] readYard failed:", err instanceof Error ? err.message : err)
    return { ok: false, error: "We couldn't read that photo. Please try a clearer outdoor photo." }
  }

  const analysis: YardAnalysis = {
    summary: reading.summary,
    regenScore: reading.regenScore,
    scores: reading.scores,
    observations: reading.observations,
    recommendations: [],
    plants: [],
    wildlife: reading.wildlife,
    climateZone: reading.climateZone,
    detected: reading.detected,
    goals: [],
  }

  const [created] = await db
    .insert(posts)
    .values({
      userId,
      imageUrl: blob.url,
      title: title || null,
      caption: caption || null,
      isShared: false,
      status: "reading",
      goals: [],
      locationLabel: resolvedLocation || null,
      lat,
      lng,
      climateZone,
      regenScore: reading.regenScore,
      biodiversityScore: reading.scores.biodiversity,
      pollinatorScore: reading.scores.pollinator,
      sunlightScore: reading.scores.sunlight,
      soilScore: reading.scores.soil,
      foodScore: reading.scores.food,
      waterScore: reading.scores.water,
      analysis,
    })
    .returning({ id: posts.id })

  revalidatePath("/")
  return { ok: true, postId: created.id, reading }
}

export type GeneratePlanResult = { ok: true } | { ok: false; error: string }

/**
 * Step 2 — "The Plan". Given the chosen goals, pull real local ecology
 * (GBIF/iNaturalist), generate goal-tailored + place-grounded recommendations
 * and plant picks (with photos), and seed the trackable action plan.
 */
export async function generatePlan(
  postId: number,
  goals: GoalKey[],
  detectedOverride?: string[],
): Promise<GeneratePlanResult> {
  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }
  if (!goals.length) return { ok: false, error: "Pick at least one goal." }

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .limit(1)
  if (!post) return { ok: false, error: "Yard not found." }

  const stored = (post.analysis ?? {}) as YardAnalysis
  const reading: YardReading = {
    summary: stored.summary ?? "",
    regenScore: stored.regenScore ?? post.regenScore,
    scores: stored.scores ?? {
      biodiversity: post.biodiversityScore,
      pollinator: post.pollinatorScore,
      sunlight: post.sunlightScore,
      soil: post.soilScore,
      food: post.foodScore,
      water: post.waterScore,
    },
    observations: stored.observations ?? [],
    detected: detectedOverride ?? stored.detected ?? [],
    wildlife: stored.wildlife ?? [],
    climateZone: stored.climateZone ?? post.climateZone,
  }

  // Pull real local ecology (best-effort; degrades to empty).
  const lat = post.lat ? Number(post.lat) : NaN
  const lng = post.lng ? Number(post.lng) : NaN
  const localContext = await getLocalEcology(lat, lng)

  let plan
  try {
    plan = await planYard({
      reading,
      goals,
      localContext,
      locationLabel: post.locationLabel,
      climateZone: post.climateZone,
    })
  } catch (err) {
    console.log("[ecointelli] planYard failed:", err instanceof Error ? err.message : err)
    return { ok: false, error: "We couldn't build your plan. Please try again." }
  }

  // Enrich plant picks with real photos (best-effort).
  try {
    const images = await getPlantImages(plan.plants.map((p) => p.name))
    plan.plants = plan.plants.map((p) => {
      const img = images[p.name]
      return img ? { ...p, imageUrl: img.imageUrl, imageAttribution: img.attribution } : p
    })
  } catch {
    /* photos are optional */
  }

  const analysis: YardAnalysis = {
    ...stored,
    summary: reading.summary,
    regenScore: reading.regenScore,
    scores: reading.scores,
    observations: reading.observations,
    wildlife: reading.wildlife,
    climateZone: reading.climateZone,
    detected: reading.detected,
    recommendations: plan.recommendations.map((r) => r.title),
    plants: plan.plants,
    goals,
    plan,
  }

  await db
    .update(posts)
    // Clear any prior visualization — it's based on the old plant list.
    .set({ analysis, goals, status: "complete", renderUrl: null, layout: null })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))

  // Reset + seed the trackable action plan from the grounded recommendations.
  await db.delete(yardTasks).where(and(eq(yardTasks.postId, postId), eq(yardTasks.userId, userId)))
  if (plan.recommendations.length > 0) {
    await db.insert(yardTasks).values(
      plan.recommendations.slice(0, 12).map((r, i) => ({
        userId,
        postId,
        label: r.title,
        detail: r.why,
        category: r.goal,
        impact: r.impact ?? null,
        sortOrder: i,
      })),
    )
  }

  revalidatePath("/")
  revalidatePath("/profile")
  revalidatePath(`/post/${postId}`)
  return { ok: true }
}

/** Remove a plant the grower doesn't want from their plan. */
export async function dismissPlant(postId: number, plantName: string): Promise<{ ok: boolean }> {
  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return { ok: false }
  }
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .limit(1)
  if (!post) return { ok: false }

  const analysis = (post.analysis ?? {}) as YardAnalysis
  analysis.plants = (analysis.plants ?? []).filter((p) => p.name !== plantName)
  if (analysis.plan) {
    analysis.plan = { ...analysis.plan, plants: analysis.plan.plants.filter((p) => p.name !== plantName) }
  }

  await db.update(posts).set({ analysis }).where(and(eq(posts.id, postId), eq(posts.userId, userId)))
  revalidatePath(`/post/${postId}`)
  return { ok: true }
}

export type VisualizeResult =
  | { ok: true; view: "render"; renderUrl: string }
  | { ok: true; view: "map"; markers: PlantingMarker[] }
  | { ok: false; error: string }

/**
 * Phase 3 — generate a planting visualization on demand. `render` re-renders
 * the yard photo with the plants grown in; `map` returns marker placements for
 * the interactive planting map. Results are cached on the post.
 */
export async function generateVisualization(
  postId: number,
  view: "render" | "map",
): Promise<VisualizeResult> {
  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .limit(1)
  if (!post) return { ok: false, error: "Yard not found." }

  const analysis = (post.analysis ?? {}) as YardAnalysis
  const plan = analysis.plan
  if (!plan || plan.plants.length === 0) {
    return { ok: false, error: "Build your plan first so we know what to plant." }
  }

  try {
    if (view === "render") {
      const renderUrl = await renderTransformed({ imageUrl: post.imageUrl, plan, userId })
      await db.update(posts).set({ renderUrl }).where(eq(posts.id, postId))
      revalidatePath(`/post/${postId}`)
      return { ok: true, view: "render", renderUrl }
    } else {
      const markers = await planLayout({ imageUrl: post.imageUrl, plan })
      await db.update(posts).set({ layout: { markers } }).where(eq(posts.id, postId))
      revalidatePath(`/post/${postId}`)
      return { ok: true, view: "map", markers }
    }
  } catch (err) {
    console.log("[ecointelli] generateVisualization failed:", err instanceof Error ? err.message : err)
    return { ok: false, error: "We couldn't generate that view. Please try again." }
  }
}

export async function setShared(postId: number, shared: boolean) {
  const userId = await getUserId()
  await db
    .update(posts)
    .set({ isShared: shared, sharedAt: shared ? new Date() : null })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
  revalidatePath("/")
  revalidatePath("/community")
  revalidatePath("/leaderboard")
  revalidatePath(`/post/${postId}`)
}

export async function deletePost(postId: number) {
  const userId = await getUserId()
  await db.delete(yardTasks).where(and(eq(yardTasks.postId, postId), eq(yardTasks.userId, userId)))
  await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.userId, userId)))
  revalidatePath("/")
  revalidatePath("/community")
  revalidatePath("/profile")
}

export async function toggleTask(taskId: number, done: boolean) {
  const userId = await getUserId()
  await db
    .update(yardTasks)
    .set({ done, completedAt: done ? new Date() : null })
    .where(and(eq(yardTasks.id, taskId), eq(yardTasks.userId, userId)))
  revalidatePath("/")
}

export async function addTask(postId: number, label: string) {
  const userId = await getUserId()
  const trimmed = label.trim()
  if (!trimmed) return
  const [own] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .limit(1)
  if (!own) return
  await db.insert(yardTasks).values({ userId, postId, label: trimmed, sortOrder: 99 })
  revalidatePath(`/post/${postId}`)
  revalidatePath("/")
}
