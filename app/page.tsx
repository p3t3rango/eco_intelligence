import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getFeed } from "@/lib/queries"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { SiteNav } from "@/components/site-nav"
import { PostCard } from "@/components/post-card"
import { Sprout, Leaf } from "lucide-react"

export default async function FeedPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  const profile = await ensureProfile()
  const [me] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id)).limit(1)
  const feed = await getFeed(session.user.id)

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <SiteNav
        user={{
          displayName: me?.displayName ?? "Gardener",
          handle: me?.handle ?? "gardener",
          avatarUrl: me?.avatarUrl ?? null,
        }}
      />

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Grow prompt */}
        <Link
          href="/grow"
          className="mb-6 flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sprout className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-medium text-foreground">Analyze your yard</p>
            <p className="text-sm text-muted-foreground">
              Snap a photo to get your Regenerative Score and habitat tips.
            </p>
          </div>
        </Link>

        {feed.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <Image src="/solarpunk-hero.png" alt="" width={220} height={165} className="rounded-xl" />
            <div className="flex items-center gap-2 text-primary">
              <Leaf className="h-5 w-5" />
              <h2 className="font-serif text-xl font-semibold">The garden is quiet</h2>
            </div>
            <p className="max-w-sm text-pretty text-sm text-muted-foreground">
              Be the first to share a patch of earth. Every photo helps grow a living map of regenerated land.
            </p>
            <Link
              href="/grow"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Share your first yard
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {feed.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
