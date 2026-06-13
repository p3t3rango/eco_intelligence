import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getLeaderboard } from "@/lib/queries"
import { SiteNav } from "@/components/site-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, MapPin, Sprout } from "lucide-react"
import { cn } from "@/lib/utils"

const RANK_STYLES = [
  "bg-accent/15 text-accent ring-1 ring-accent/30",
  "bg-muted text-foreground/70 ring-1 ring-border",
  "bg-clay/15 text-clay ring-1 ring-clay/30",
]

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  const me = await ensureProfile()
  const leaders = await getLeaderboard()

  return (
    <div className="min-h-dvh pb-24 sm:pb-0">
      <SiteNav
        user={{
          displayName: me?.displayName ?? "Gardener",
          handle: me?.handle ?? "gardener",
          avatarUrl: me?.avatarUrl ?? null,
        }}
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Regeneration Leaders</h1>
            <p className="text-sm text-muted-foreground">Ranked by total ecological impact across all shared land.</p>
          </div>
        </div>

        {leaders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 py-16 text-center">
            <Sprout className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">No scores yet. Be the first to plant the flag.</p>
            <Link href="/grow" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
              Analyze your yard
            </Link>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {leaders.map((leader, i) => {
              const isMe = leader.userId === session.user.id
              return (
                <li key={leader.userId}>
                  <Link
                    href={`/u/${leader.handle}`}
                    className={cn(
                      "lift flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft",
                      isMe ? "border-primary/40 ring-1 ring-primary/20" : "border-border/70",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-serif text-lg font-bold",
                        i < 3 ? RANK_STYLES[i] : "text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={leader.avatarUrl ?? undefined} alt={leader.displayName} />
                      <AvatarFallback>{leader.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">{leader.displayName}</span>
                        {isMe ? <span className="text-xs font-medium text-primary">You</span> : null}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>@{leader.handle}</span>
                        {leader.locationLabel ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {leader.locationLabel}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gradient font-serif text-2xl font-bold">{leader.totalImpact}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {leader.postCount} {leader.postCount === 1 ? "yard" : "yards"} · best {leader.bestScore}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </main>
    </div>
  )
}
