import Link from "next/link"
import Image from "next/image"
import type { FeedPost } from "@/lib/queries"
import { ShareToggle } from "@/components/share-toggle"
import { ScoreRing } from "@/components/score-ring"
import { ListChecks, MapPin, CheckCircle2 } from "lucide-react"

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function YardCard({ post }: { post: FeedPost }) {
  const total = post.taskCount
  const done = post.taskDone
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <article className="lift overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="flex gap-4 p-4">
        <Link href={`/post/${post.id}`} className="relative block shrink-0">
          <Image
            src={post.imageUrl || "/placeholder.svg"}
            alt={post.title ?? "Your yard"}
            width={120}
            height={120}
            className="h-24 w-24 rounded-2xl object-cover"
          />
          <div className="glass absolute -bottom-2 -right-2 rounded-full p-0.5 shadow-soft">
            <ScoreRing score={post.regenScore} size={40} stroke={5} />
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/post/${post.id}`} className="min-w-0">
              <h3 className="truncate font-serif text-lg font-semibold text-foreground">
                {post.title || "Yard analysis"}
              </h3>
              <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
            </Link>
            <ShareToggle postId={post.id} initialShared={post.isShared} variant="chip" />
          </div>

          {post.locationLabel ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{post.locationLabel}</span>
            </div>
          ) : null}

          {/* Action plan progress */}
          {total > 0 ? (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  {allDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ListChecks className="h-3.5 w-3.5 text-primary" />
                  )}
                  {allDone ? "Plan complete" : "Action plan"}
                </span>
                <span className="font-semibold tabular-nums text-muted-foreground">
                  {done}/{total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No action items yet.</p>
          )}
        </div>
      </div>
    </article>
  )
}
