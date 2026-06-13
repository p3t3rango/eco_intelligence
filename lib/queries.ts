import { db } from "@/lib/db"
import { comments, likes, posts, profiles } from "@/lib/db/schema"
import { desc, eq, sql, and } from "drizzle-orm"

export type FeedPost = {
  id: number
  imageUrl: string
  caption: string | null
  locationLabel: string | null
  climateZone: string | null
  regenScore: number
  scores: {
    biodiversity: number
    pollinator: number
    sunlight: number
    soil: number
    food: number
    water: number
  }
  analysis: unknown
  createdAt: Date
  author: {
    userId: string
    displayName: string
    handle: string
    avatarUrl: string | null
    locationLabel: string | null
  }
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

function mapRow(row: any, likedByMe: boolean): FeedPost {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    caption: row.caption,
    locationLabel: row.locationLabel,
    climateZone: row.climateZone,
    regenScore: row.regenScore,
    scores: {
      biodiversity: row.biodiversityScore,
      pollinator: row.pollinatorScore,
      sunlight: row.sunlightScore,
      soil: row.soilScore,
      food: row.foodScore,
      water: row.waterScore,
    },
    analysis: row.analysis,
    createdAt: row.createdAt,
    author: {
      userId: row.authorId,
      displayName: row.displayName ?? "Gardener",
      handle: row.handle ?? "gardener",
      avatarUrl: row.avatarUrl ?? null,
      locationLabel: row.authorLocation ?? null,
    },
    likeCount: Number(row.likeCount ?? 0),
    commentCount: Number(row.commentCount ?? 0),
    likedByMe,
  }
}

const baseSelect = {
  id: posts.id,
  imageUrl: posts.imageUrl,
  caption: posts.caption,
  locationLabel: posts.locationLabel,
  climateZone: posts.climateZone,
  regenScore: posts.regenScore,
  biodiversityScore: posts.biodiversityScore,
  pollinatorScore: posts.pollinatorScore,
  sunlightScore: posts.sunlightScore,
  soilScore: posts.soilScore,
  foodScore: posts.foodScore,
  waterScore: posts.waterScore,
  analysis: posts.analysis,
  createdAt: posts.createdAt,
  authorId: posts.userId,
  displayName: profiles.displayName,
  handle: profiles.handle,
  avatarUrl: profiles.avatarUrl,
  authorLocation: profiles.locationLabel,
  likeCount: sql<number>`(select count(*) from ${likes} where ${likes.postId} = ${posts.id})`,
  commentCount: sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${posts.id})`,
}

async function likedSet(currentUserId: string | null, postIds: number[]) {
  if (!currentUserId || postIds.length === 0) return new Set<number>()
  const rows = await db.select({ postId: likes.postId }).from(likes).where(eq(likes.userId, currentUserId))
  return new Set(rows.map((r) => r.postId))
}

export async function getFeed(currentUserId: string | null): Promise<FeedPost[]> {
  const rows = await db
    .select(baseSelect)
    .from(posts)
    .leftJoin(profiles, eq(profiles.userId, posts.userId))
    .orderBy(desc(posts.createdAt))
    .limit(50)

  const liked = await likedSet(
    currentUserId,
    rows.map((r) => r.id),
  )
  return rows.map((r) => mapRow(r, liked.has(r.id)))
}

export async function getPost(postId: number, currentUserId: string | null): Promise<FeedPost | null> {
  const [row] = await db
    .select(baseSelect)
    .from(posts)
    .leftJoin(profiles, eq(profiles.userId, posts.userId))
    .where(eq(posts.id, postId))
    .limit(1)
  if (!row) return null
  const liked = await likedSet(currentUserId, [row.id])
  return mapRow(row, liked.has(row.id))
}

export async function getPostsByUser(userId: string, currentUserId: string | null): Promise<FeedPost[]> {
  const rows = await db
    .select(baseSelect)
    .from(posts)
    .leftJoin(profiles, eq(profiles.userId, posts.userId))
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))

  const liked = await likedSet(
    currentUserId,
    rows.map((r) => r.id),
  )
  return rows.map((r) => mapRow(r, liked.has(r.id)))
}

export type CommentRow = {
  id: number
  body: string
  createdAt: Date
  author: { displayName: string; handle: string; avatarUrl: string | null }
}

export async function getComments(postId: number): Promise<CommentRow[]> {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      displayName: profiles.displayName,
      handle: profiles.handle,
      avatarUrl: profiles.avatarUrl,
    })
    .from(comments)
    .leftJoin(profiles, eq(profiles.userId, comments.userId))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: {
      displayName: r.displayName ?? "Gardener",
      handle: r.handle ?? "gardener",
      avatarUrl: r.avatarUrl ?? null,
    },
  }))
}

export type LeaderRow = {
  userId: string
  displayName: string
  handle: string
  avatarUrl: string | null
  locationLabel: string | null
  bestScore: number
  avgScore: number
  postCount: number
  totalImpact: number
}

export async function getLeaderboard(): Promise<LeaderRow[]> {
  const rows = await db
    .select({
      userId: profiles.userId,
      displayName: profiles.displayName,
      handle: profiles.handle,
      avatarUrl: profiles.avatarUrl,
      locationLabel: profiles.locationLabel,
      bestScore: sql<number>`coalesce(max(${posts.regenScore}), 0)`,
      avgScore: sql<number>`coalesce(round(avg(${posts.regenScore})), 0)`,
      postCount: sql<number>`count(${posts.id})`,
      totalImpact: sql<number>`coalesce(sum(${posts.regenScore}), 0)`,
    })
    .from(profiles)
    .leftJoin(posts, eq(posts.userId, profiles.userId))
    .groupBy(profiles.userId, profiles.displayName, profiles.handle, profiles.avatarUrl, profiles.locationLabel)
    .orderBy(desc(sql`coalesce(sum(${posts.regenScore}), 0)`))
    .limit(50)

  return rows
    .filter((r) => Number(r.postCount) > 0)
    .map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      handle: r.handle,
      avatarUrl: r.avatarUrl,
      locationLabel: r.locationLabel,
      bestScore: Number(r.bestScore),
      avgScore: Number(r.avgScore),
      postCount: Number(r.postCount),
      totalImpact: Number(r.totalImpact),
    }))
}

export async function getProfileByHandle(handle: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.handle, handle)).limit(1)
  return profile ?? null
}

export async function getProfileStats(userId: string) {
  const [stats] = await db
    .select({
      postCount: sql<number>`count(${posts.id})`,
      bestScore: sql<number>`coalesce(max(${posts.regenScore}), 0)`,
      avgScore: sql<number>`coalesce(round(avg(${posts.regenScore})), 0)`,
      totalImpact: sql<number>`coalesce(sum(${posts.regenScore}), 0)`,
    })
    .from(posts)
    .where(eq(posts.userId, userId))
  return {
    postCount: Number(stats?.postCount ?? 0),
    bestScore: Number(stats?.bestScore ?? 0),
    avgScore: Number(stats?.avgScore ?? 0),
    totalImpact: Number(stats?.totalImpact ?? 0),
  }
}
