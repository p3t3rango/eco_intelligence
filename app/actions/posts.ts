"use server"

import { db } from "@/lib/db"
import { posts, profiles, yardTasks } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { analyzeYard } from "@/lib/analyze"
import { geocodePlace } from "@/lib/geo"
import { put } from "@vercel/blob"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type CreatePostResult = { ok: true; postId: number } | { ok: false; error: string }

export async function createPost(formData: FormData): Promise<CreatePostResult> {
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

  // Upload the image to Blob storage.
  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg")
  let blob
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not set")
    }
    blob = await put(`yards/${userId}/${Date.now()}.${ext}`, bytes, {
      access: "public",
      contentType: file.type || "image/jpeg",
    })
  } catch (err) {
    console.log("[v0] blob upload failed:", err instanceof Error ? err.message : err)
    return {
      ok: false,
      error: "Photo storage isn't connected in this preview yet. It will work automatically once the app is published.",
    }
  }

  // Run the Gemini ecological analysis.
  let analysis
  try {
    analysis = await analyzeYard({
      imageBase64: bytes.toString("base64"),
      mimeType: file.type || "image/jpeg",
      climateZone,
      locationLabel: resolvedLocation,
    })
  } catch (err) {
    console.log("[v0] analyzeYard failed:", err instanceof Error ? err.message : err)
    return { ok: false, error: "We couldn't analyze that photo. Please try a clearer outdoor photo." }
  }

  // Analyses are PRIVATE by default. Sharing to the community is opt-in.
  const [created] = await db
    .insert(posts)
    .values({
      userId,
      imageUrl: blob.url,
      title: title || null,
      caption: caption || null,
      isShared: false,
      locationLabel: resolvedLocation || null,
      lat,
      lng,
      climateZone,
      regenScore: analysis.regenScore,
      biodiversityScore: analysis.scores.biodiversity,
      pollinatorScore: analysis.scores.pollinator,
      sunlightScore: analysis.scores.sunlight,
      soilScore: analysis.scores.soil,
      foodScore: analysis.scores.food,
      waterScore: analysis.scores.water,
      analysis,
    })
    .returning({ id: posts.id })

  // Seed a trackable action plan from the AI recommendations.
  const recs = Array.isArray(analysis.recommendations) ? analysis.recommendations : []
  if (recs.length > 0) {
    await db.insert(yardTasks).values(
      recs.slice(0, 12).map((label, i) => ({
        userId,
        postId: created.id,
        label,
        sortOrder: i,
      })),
    )
  }

  revalidatePath("/")
  revalidatePath("/profile")

  return { ok: true, postId: created.id }
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
  // Verify the post belongs to the user before attaching a task.
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
