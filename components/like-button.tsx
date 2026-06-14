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
        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
        liked
          ? "border-coral/50 bg-coral/15 text-coral"
          : "border-border text-muted-foreground hover:border-coral/50 hover:text-coral",
      )}
    >
      <Heart key={`${liked}`} className={cn("h-5 w-5", liked && "animate-pop fill-current")} />
      {count} {count === 1 ? "cheer" : "cheers"}
    </button>
  )
}
