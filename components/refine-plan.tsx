"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { generatePlan } from "@/app/actions/posts"
import { GoalPicker } from "@/components/goal-picker"
import { GOALS, type GoalKey } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, SlidersHorizontal, Target } from "lucide-react"

/**
 * Owner control to choose goals (first time, e.g. legacy posts) or refine them
 * and rebuild the plan. Replanning resets the action plan and clears the old
 * visualization so it regenerates for the new plant list.
 */
export function RefinePlan({
  postId,
  initialGoals,
}: {
  postId: number
  initialGoals: GoalKey[]
}) {
  const router = useRouter()
  const hasGoals = initialGoals.length > 0
  const [editing, setEditing] = useState(false)
  const [goals, setGoals] = useState<GoalKey[]>(initialGoals)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function rebuild() {
    if (goals.length === 0) {
      setError("Pick at least one goal.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await generatePlan(postId, goals)
      if (res.ok) {
        setEditing(false)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  // Collapsed view
  if (!editing) {
    if (hasGoals) {
      return (
        <div className="rounded-organic border border-border/60 bg-secondary/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your goals</span>
            {initialGoals.map((g) => {
              const meta = GOALS.find((x) => x.key === g)
              return (
                <span key={g} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {meta?.emoji} {meta?.label ?? g}
                </span>
              )
            })}
            <button
              onClick={() => setEditing(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Refine &amp; replan
            </button>
          </div>
        </div>
      )
    }
    // Legacy post with no goals yet
    return (
      <div className="rounded-organic bg-leaf-dots border-2 border-primary/30 bg-card p-5 text-center shadow-soft">
        <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-leaf bg-primary/10 text-primary">
          <Target className="h-6 w-6" />
        </span>
        <h3 className="font-serif text-xl font-semibold text-foreground">Set your goals to get a plan</h3>
        <p className="mx-auto mt-1 mb-3 max-w-sm text-sm text-muted-foreground">
          Tell us what you want this space to become and we&apos;ll build a place-grounded plan with plants and steps.
        </p>
        <Button onClick={() => setEditing(true)} className="rounded-full glow-primary">
          <Target className="h-4 w-4" /> Choose goals
        </Button>
      </div>
    )
  }

  // Editing view
  return (
    <div className="rounded-organic border-2 border-primary/30 bg-card p-5 shadow-soft">
      <h3 className="mb-3 font-serif text-lg font-semibold text-foreground">What do you want this space to become?</h3>
      <GoalPicker value={goals} onChange={setGoals} />
      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={() => { setEditing(false); setGoals(initialGoals); setError(null) }} disabled={isPending} className="rounded-2xl">
          Cancel
        </Button>
        <Button onClick={rebuild} disabled={isPending || goals.length === 0} className="flex-1 rounded-2xl glow-primary">
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Rebuilding your plan…</> : <><Sparkles className="h-4 w-4" /> {hasGoals ? "Rebuild plan" : "Build my plan"}</>}
        </Button>
      </div>
      {isPending ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">Re-grounding to your area and goals…</p>
      ) : null}
    </div>
  )
}
