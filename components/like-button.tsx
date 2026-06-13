"use client"

import { useState, useTransition } from "react"
import { toggleLike } from "@/app/actions/social"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: number
  initialLiked: boolean
  initialCount: number
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function onLike() {
    setLiked((p) => !p)
    setCount((c) => (liked ? c - 1 : c + 1))
    startTransition(() => toggleLike(postId))
  }

  return (
    <button
      onClick={onLike}
      disabled={isPending}
      aria-pressed={liked}
      className={cn(
        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        liked
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border text-muted-foreground hover:border-accent/40 hover:text-accent",
      )}
    >
      <Heart className={cn("h-5 w-5", liked && "fill-current")} />
      {count} {count === 1 ? "cheer" : "cheers"}
    </button>
  )
}
