"use client"

import { useState, useTransition } from "react"
import { setShared } from "@/app/actions/posts"
import { cn } from "@/lib/utils"
import { Globe, Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ShareToggle({
  postId,
  initialShared,
  variant = "button",
}: {
  postId: number
  initialShared: boolean
  variant?: "button" | "chip"
}) {
  const [shared, setSharedState] = useState(initialShared)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !shared
    setSharedState(next)
    startTransition(async () => {
      try {
        await setShared(postId, next)
        toast.success(next ? "Shared with the community" : "Moved back to private")
      } catch {
        setSharedState(!next)
        toast.error("Couldn't update sharing. Try again.")
      }
    })
  }

  if (variant === "chip") {
    return (
      <button
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
          shared
            ? "bg-primary/12 text-primary ring-1 ring-primary/25"
            : "bg-muted text-muted-foreground ring-1 ring-border",
        )}
        aria-pressed={shared}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : shared ? (
          <Globe className="h-3.5 w-3.5" />
        ) : (
          <Lock className="h-3.5 w-3.5" />
        )}
        {shared ? "Shared" : "Private"}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]",
        shared
          ? "border border-border bg-card text-foreground hover:bg-secondary"
          : "bg-[linear-gradient(105deg,var(--primary),oklch(0.6_0.16_120)_55%,var(--accent))] text-primary-foreground shadow-soft hover:glow-primary",
      )}
      aria-pressed={shared}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : shared ? (
        <Lock className="h-4 w-4" />
      ) : (
        <Globe className="h-4 w-4" />
      )}
      {shared ? "Make private" : "Share for feedback"}
    </button>
  )
}
