import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getCommunityFeed } from "@/lib/queries"
import { SiteNav } from "@/components/site-nav"
import { PostCard } from "@/components/post-card"
import { Users, Sprout } from "lucide-react"

export default async function CommunityPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  const profile = await ensureProfile()
  const feed = await getCommunityFeed(session.user.id)

  return (
    <div className="min-h-dvh pb-24 sm:pb-0">
      <SiteNav
        user={{
          displayName: profile?.displayName ?? "Gardener",
          handle: profile?.handle ?? "gardener",
          avatarUrl: profile?.avatarUrl ?? null,
        }}
      />

      <main className="mx-auto max-w-2xl px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <span className="bg-primary glow-primary flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-foreground">Community</h1>
            <p className="text-sm text-muted-foreground">Yards growers chose to share — cheer them on and trade ideas.</p>
          </div>
        </header>

        {feed.length === 0 ? (
          <div className="bg-leaf-dots flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/60 px-6 py-16 text-center shadow-soft">
            <span className="bg-primary animate-float flex h-16 w-16 items-center justify-center rounded-3xl text-primary-foreground glow-primary">
              <Sprout className="h-8 w-8" />
            </span>
            <h2 className="font-serif text-3xl font-extrabold text-foreground">Nothing shared yet</h2>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Be the first to open up a patch of earth. Analyze your yard, then tap “Share for feedback” to add it here.
            </p>
            <Link
              href="/grow"
              className="bg-primary lift rounded-full px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:glow-primary"
            >
              Analyze your yard
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
