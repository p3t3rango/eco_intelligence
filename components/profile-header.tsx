import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"

type Profile = {
  displayName: string
  handle: string
  bio: string | null
  avatarUrl: string | null
  locationLabel: string | null
  climateZone: string | null
}

type Stats = {
  postCount: number
  bestScore: number
  avgScore: number
  totalImpact: number
}

export function ProfileHeader({
  profile,
  stats,
  action,
}: {
  profile: Profile
  stats: Stats
  action?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft animate-rise">
      <div className="bg-sun-rays pointer-events-none absolute inset-x-0 -top-10 h-32" aria-hidden />
      <div className="relative flex items-start gap-4">
        <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-soft">
          <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
          <AvatarFallback className="bg-secondary text-2xl text-secondary-foreground">{profile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-foreground font-display text-3xl font-extrabold leading-tight">
                {profile.displayName}
              </h1>
              <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            </div>
            {action}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {profile.locationLabel ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.locationLabel}
              </span>
            ) : null}
            {profile.climateZone ? <Badge variant="outline">{profile.climateZone}</Badge> : null}
          </div>
        </div>
      </div>

      {profile.bio ? <p className="relative mt-4 text-pretty text-sm leading-relaxed text-foreground/90">{profile.bio}</p> : null}

      <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Stat label="Total impact" value={stats.totalImpact} highlight />
        <Stat label="Best score" value={stats.bestScore} />
        <Stat label="Yards" value={stats.postCount} />
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-secondary/40 py-3 text-center">
      <div className={`font-display text-3xl font-extrabold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}
