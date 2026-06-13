"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useTransition } from "react"
import type { FeedPost } from "@/lib/queries"
import type { YardAnalysis } from "@/lib/types"
import { toggleLike } from "@/app/actions/social"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScoreRing } from "@/components/score-ring"
import { MetricBars } from "@/components/metric-bars"
import { Heart, MessageCircle, MapPin, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

function timeAgo(date: Date) {
  const d = new Date(date)
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  const units: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ]
  for (const [s, label] of units) {
    const v = Math.floor(seconds / s)
    if (v >= 1) return `${v}${label} ago`
  }
  return "just now"
}

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [count, setCount] = useState(post.likeCount)
  const [isPending, startTransition] = useTransition()
  const analysis = post.analysis as YardAnalysis | null

  function onLike() {
    setLiked((p) => !p)
    setCount((c) => (liked ? c - 1 : c + 1))
    startTransition(() => toggleLike(post.id))
  }

  return (
    <article className="lift overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      {/* Author */}
      <div className="flex items-center gap-3 p-4">
        <Link href={`/u/${post.author.handle}`}>
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.displayName} />
            <AvatarFallback>{post.author.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${post.author.handle}`} className="block truncate font-medium leading-tight text-foreground">
            {post.author.displayName}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>@{post.author.handle}</span>
            <span aria-hidden>·</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
        {post.climateZone ? (
          <Badge variant="outline" className="hidden sm:inline-flex">
            {post.climateZone}
          </Badge>
        ) : null}
      </div>

      {/* Image with score overlay */}
      <Link href={`/post/${post.id}`} className="group relative block overflow-hidden">
        <Image
          src={post.imageUrl || "/placeholder.svg"}
          alt={post.caption ?? "Yard photo"}
          width={800}
          height={600}
          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
        <div className="glass absolute right-3 top-3 rounded-2xl p-1.5 shadow-soft">
          <ScoreRing score={post.regenScore} size={72} stroke={7} />
        </div>
      </Link>

      <div className="space-y-4 p-4">
        {post.caption ? <p className="text-pretty text-sm leading-relaxed text-foreground">{post.caption}</p> : null}

        {post.locationLabel ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {post.locationLabel}
          </div>
        ) : null}

        {analysis?.summary ? (
          <div className="bg-bloom rounded-2xl border border-primary/15 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Ecological Read
            </div>
            <p className="text-pretty text-sm leading-relaxed text-foreground/90">{analysis.summary}</p>
          </div>
        ) : null}

        <MetricBars scores={post.scores} />

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-border/70 pt-3">
          <button
            onClick={onLike}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              liked ? "bg-clay/10 text-clay" : "text-muted-foreground hover:bg-clay/10 hover:text-clay",
            )}
            aria-pressed={liked}
            aria-label="Cheer this garden"
          >
            <Heart key={`${liked}`} className={cn("h-5 w-5", liked && "animate-pop fill-current")} />
            {count}
          </button>
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MessageCircle className="h-5 w-5" />
            {post.commentCount}
          </Link>
        </div>
      </div>
    </article>
  )
}
