import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getMyYards, getDashboardSummary } from "@/lib/queries"
import { SiteNav } from "@/components/site-nav"
import { YardCard } from "@/components/yard-card"
import { Sprout, Leaf, TrendingUp, ListChecks, Award, Camera } from "lucide-react"

export default async function MyYardPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  const profile = await ensureProfile()
  const [yards, summary] = await Promise.all([
    getMyYards(session.user.id),
    getDashboardSummary(session.user.id),
  ])

  const firstName = (profile?.displayName ?? "Gardener").split(" ")[0]
  const growth =
    summary.firstScore != null && summary.latestScore != null ? summary.latestScore - summary.firstScore : null

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
        <header className="mb-5">
          <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground text-balance">
            {firstName}&apos;s yard
          </h1>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            Your private space to understand your land and grow it more alive over time.
          </p>
        </header>

        {yards.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stat tiles */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                icon={Leaf}
                label="Latest score"
                value={summary.latestScore != null ? `${summary.latestScore}` : "—"}
                hint={growth != null ? `${growth >= 0 ? "+" : ""}${growth} since first` : undefined}
                positive={growth != null && growth >= 0}
              />
              <StatTile icon={Award} label="Best score" value={`${summary.bestScore}`} />
              <StatTile
                icon={ListChecks}
                label="Steps done"
                value={`${summary.doneTasks}`}
                hint={summary.openTasks > 0 ? `${summary.openTasks} to go` : "all caught up"}
              />
              <StatTile icon={TrendingUp} label="Yards tracked" value={`${summary.yardCount}`} hint={`${summary.sharedCount} shared`} />
            </div>

            {/* Analyze CTA */}
            <Link
              href="/grow"
              className="lift bg-bloom group mb-6 flex items-center gap-3 overflow-hidden rounded-2xl border border-primary/20 p-3.5 shadow-soft"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-primary">
                <Camera className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Analyze a new photo</p>
                <p className="text-xs text-muted-foreground">Track changes or scan another part of your yard.</p>
              </div>
              <Sprout className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-12" />
            </Link>

            <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
              Your yards
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {yards.length}
              </span>
            </h2>
            <div className="flex flex-col gap-4">
              {yards.map((post, i) => (
                <div key={post.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                  <YardCard post={post} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  positive,
}: {
  icon: typeof Leaf
  label: string
  value: string
  hint?: string
  positive?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-soft">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 font-serif text-2xl font-bold leading-none text-foreground">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
      {hint ? (
        <div className={`mt-0.5 text-[11px] font-semibold ${positive ? "text-primary" : "text-muted-foreground"}`}>
          {hint}
        </div>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-leaf-dots flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/60 px-6 py-14 text-center shadow-soft">
      <Image
        src="/solarpunk-hero.png"
        alt=""
        width={240}
        height={180}
        className="rounded-2xl shadow-lift ring-1 ring-border/50"
      />
      <div className="flex items-center gap-2 text-primary">
        <Leaf className="h-5 w-5" />
        <h2 className="font-serif text-2xl font-semibold">Let&apos;s meet your yard</h2>
      </div>
      <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
        Snap a photo of your yard, garden, balcony, or any patch of green. You&apos;ll get a Regenerative Score,
        an ecological read, and a personalized plan to make it more alive — all private until you choose to share.
      </p>
      <Link
        href="/grow"
        className="flex items-center gap-2 rounded-full bg-[linear-gradient(105deg,var(--primary),oklch(0.6_0.16_120)_55%,var(--accent))] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:glow-primary"
      >
        <Camera className="h-4 w-4" />
        Analyze your first yard
      </Link>
    </div>
  )
}
