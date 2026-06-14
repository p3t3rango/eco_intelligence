import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getMyYards, getDashboardSummary } from "@/lib/queries"
import { SiteNav } from "@/components/site-nav"
import { YardCard } from "@/components/yard-card"
import { Sprout, Leaf, TrendingUp, ListChecks, Award, Camera } from "lucide-react"
import { Vine, LeafSpray, BranchDivider } from "@/components/botanical"

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
        <header className="mb-6">
          <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-primary">
            <Sprout className="h-4 w-4" /> Welcome back
          </p>
          <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            {firstName}&apos;s yard
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            Your private space to understand your land and grow it more alive over time.
          </p>
        </header>

        {yards.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Regenerative Score hero */}
            <div className="bg-hero rounded-organic-lg relative mb-5 overflow-hidden p-5 shadow-lift glow-primary">
              <div className="bg-sun-rays pointer-events-none absolute inset-0 opacity-60" />
              <Vine className="pointer-events-none absolute -right-2 top-1/2 h-24 w-72 -translate-y-1/2 text-primary-foreground/20" />
              <div className="relative flex items-end justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground/90">
                    <Leaf className="h-4 w-4" /> Regenerative Score
                  </p>
                  <div className="mt-1 flex items-end gap-2 text-primary-foreground">
                    <span className="font-serif text-7xl font-semibold leading-none tracking-tight tabular-nums">
                      {summary.latestScore != null ? summary.latestScore : "—"}
                    </span>
                    {growth != null ? (
                      <span className="mb-1.5 flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-bold text-primary-foreground ring-1 ring-primary-foreground/20">
                        {growth >= 0 ? "↑" : "↓"} {growth >= 0 ? "+" : ""}
                        {growth} since first
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-primary-foreground/90">
                  <p className="text-xs font-bold uppercase tracking-wide">Best</p>
                  <p className="font-serif text-3xl font-semibold leading-none tabular-nums">{summary.bestScore}</p>
                </div>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              <StatTile
                icon={ListChecks}
                label="Steps done"
                value={`${summary.doneTasks}`}
                hint={summary.openTasks > 0 ? `${summary.openTasks} to go` : "all caught up"}
                tone="grape"
                positive={summary.openTasks === 0}
              />
              <StatTile
                icon={TrendingUp}
                label="Yards"
                value={`${summary.yardCount}`}
                hint={`${summary.sharedCount} shared`}
                tone="cyan"
              />
              <StatTile
                icon={Award}
                label="Best score"
                value={`${summary.bestScore}`}
                tone="coral"
              />
            </div>

            {/* Analyze CTA */}
            <Link
              href="/grow"
              className="lift bg-bloom bg-grain rounded-organic group mb-7 flex items-center gap-3 overflow-hidden border-2 border-primary/30 p-4 shadow-soft hover:glow-primary"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-primary transition-transform duration-300 group-hover:scale-110">
                <Camera className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-base font-extrabold text-foreground">Analyze a new photo</p>
                <p className="text-xs text-muted-foreground">Track changes or scan another part of your yard.</p>
              </div>
              <Sprout className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-12" />
            </Link>

            <div className="mb-3 flex items-center gap-3">
              <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-foreground">
                Your yards
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                  {yards.length}
                </span>
              </h2>
              <BranchDivider className="h-3 flex-1 text-primary/25" />
            </div>
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

const TONES = {
  primary: { chip: "bg-primary/15 text-primary", value: "text-foreground", good: "text-primary" },
  grape: { chip: "bg-grape/15 text-grape", value: "text-grape", good: "text-grape" },
  coral: { chip: "bg-coral/15 text-coral", value: "text-coral", good: "text-coral" },
  cyan: { chip: "bg-cyan/20 text-foreground", value: "text-foreground", good: "text-cyan" },
} as const

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  positive,
  tone = "primary",
}: {
  icon: typeof Leaf
  label: string
  value: string
  hint?: string
  positive?: boolean
  tone?: keyof typeof TONES
}) {
  const t = TONES[tone]
  return (
    <div className="lift rounded-organic border-2 border-border/60 bg-card p-3.5 shadow-soft">
      <span className={`flex h-9 w-9 items-center justify-center rounded-leaf ${t.chip}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className={`mt-2.5 font-serif text-3xl font-semibold leading-none tabular-nums ${t.value}`}>{value}</div>
      <div className="mt-1.5 text-xs font-bold text-muted-foreground">{label}</div>
      {hint ? (
        <div className={`mt-0.5 text-[11px] font-bold ${positive ? t.good : "text-muted-foreground"}`}>
          {hint}
        </div>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-leaf-dots bg-grain rounded-organic-lg flex flex-col items-center gap-4 border-2 border-border/60 bg-card/60 px-6 py-14 text-center shadow-soft">
      <span className="flex h-20 w-20 items-center justify-center rounded-leaf bg-primary/10 text-primary ring-1 ring-primary/20">
        <LeafSpray className="h-11 w-11" />
      </span>
      <div className="flex items-center gap-2 text-foreground">
        <h2 className="font-serif text-3xl font-semibold">Let&apos;s meet your yard</h2>
      </div>
      <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
        Snap a photo of your yard, garden, balcony, or any patch of green. You&apos;ll get a Regenerative Score,
        an ecological read, and a personalized plan to make it more alive — all private until you choose to share.
      </p>
      <Link
        href="/grow"
        className="bg-primary lift flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-soft glow-primary"
      >
        <Camera className="h-4 w-4" />
        Analyze your first yard
      </Link>
    </div>
  )
}
