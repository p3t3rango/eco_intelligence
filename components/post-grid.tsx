import Link from "next/link"
import Image from "next/image"
import type { FeedPost } from "@/lib/queries"
import { ScoreRing } from "@/components/score-ring"
import { Lock } from "lucide-react"

export function PostGrid({ posts }: { posts: FeedPost[] }) {
  if (posts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card/60 py-12 text-center text-sm text-muted-foreground">
        No yards shared yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="group relative overflow-hidden rounded-xl border border-border"
        >
          <Image
            src={post.imageUrl || "/placeholder.svg"}
            alt={post.caption ?? "Yard"}
            width={300}
            height={300}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="glass absolute right-2 top-2 rounded-xl p-1">
            <ScoreRing score={post.regenScore} size={48} stroke={5} label="" />
          </div>
          {!post.isShared ? (
            <span className="glass absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  )
}
