import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function getUserId() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export async function getCurrentProfile() {
  const session = await getSession()
  if (!session?.user) return null
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id)).limit(1)
  return profile ?? null
}
