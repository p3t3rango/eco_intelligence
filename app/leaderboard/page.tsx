import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getLeaderboard } from "@/lib/queries"
import { SiteNav } from "@/components/site-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, MapPin, Sprout, Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

const RANK_STYLES = [
  "bg-lime/20 text-foreground ring-1 ring-lime/50 glow-accent",
  "bg-cyan/20 text-foreground ring-1 ring-cyan/50",
  "bg-coral/20 text-coral ring-1 ring-coral/50",
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
          <span className="bg-primary glow-accent flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-semibold text-foreground">Regeneration Leaders</h1>
            <p className="text-sm text-muted-foreground">Ranked by total ecological impact across all shared land.</p>
          </div>
        </div>

        {leaders.length === 0 ? (
          <div className="bg-leaf-dots flex flex-col items-center gap-3 rounded-organic border border-border/70 bg-card/60 py-16 text-center shadow-soft">
            <Sprout className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">No scores yet. Be the first to plant the flag.</p>
            <Link href="/grow" className="bg-primary lift rounded-full px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:glow-primary">
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
                      "lift flex items-center gap-3 rounded-organic border bg-card p-4 shadow-soft sm:gap-4",
                      isMe ? "border-primary/50 ring-2 ring-primary/25" : "border-border/70",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-leaf font-serif text-lg font-semibold",
                        i < 3 ? RANK_STYLES[i] : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    {/* representative shared yard */}
                    {leader.topYardImage ? (
                      <div className="relative hidden h-12 w-12 shrink-0 overflow-hidden rounded-leaf bg-muted sm:block">
                        <Image src={leader.topYardImage} alt="" fill sizes="48px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-leaf bg-primary/10 text-primary sm:flex">
                        <Leaf className="h-5 w-5" />
                      </div>
                    )}
                    <Avatar className="h-11 w-11 border border-border">
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
                      <div className="text-primary font-serif text-2xl font-bold">{leader.totalImpact}</div>
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
