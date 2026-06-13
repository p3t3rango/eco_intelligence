"use server"

import { db } from "@/lib/db"
import { comments, likes } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function toggleLike(postId: number) {
  const userId = await getUserId()
  const [existing] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1)

  if (existing) {
    await db.delete(likes).where(eq(likes.id, existing.id))
  } else {
    await db.insert(likes).values({ postId, userId })
  }
  revalidatePath("/")
  revalidatePath(`/post/${postId}`)
}

export async function addComment(postId: number, body: string) {
  const userId = await getUserId()
  const trimmed = body.trim()
  if (!trimmed) return
  await db.insert(comments).values({ postId, userId, body: trimmed.slice(0, 600) })
  revalidatePath(`/post/${postId}`)
  revalidatePath("/")
}
