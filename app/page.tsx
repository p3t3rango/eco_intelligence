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
          className="lift bg-bloom group mb-6 flex items-center gap-4 overflow-hidden rounded-3xl border border-primary/20 p-4 shadow-soft"
        >
          <span className="animate-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-primary">
            <Sprout className="h-7 w-7" />
          </span>
          <div className="flex-1">
            <p className="font-serif text-lg font-semibold text-foreground">Analyze your yard</p>
            <p className="text-sm text-muted-foreground">
              Snap a photo to get your Regenerative Score and habitat tips.
            </p>
          </div>
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-300 group-hover:translate-x-0.5 sm:flex">
            Start
          </span>
        </Link>

        {feed.length === 0 ? (
          <div className="bg-leaf-dots flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/60 px-6 py-16 text-center shadow-soft">
            <Image
              src="/solarpunk-hero.png"
              alt=""
              width={220}
              height={165}
              className="rounded-2xl shadow-lift ring-1 ring-border/50"
            />
            <div className="flex items-center gap-2 text-primary">
              <Leaf className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-semibold">The garden is quiet</h2>
            </div>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Be the first to share a patch of earth. Every photo helps grow a living map of regenerated land.
            </p>
            <Link
              href="/grow"
              className="rounded-full bg-[linear-gradient(105deg,var(--primary),oklch(0.6_0.16_120)_55%,var(--accent))] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:glow-primary"
            >
              Share your first yard
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {feed.map((post, i) => (
              <div key={post.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
