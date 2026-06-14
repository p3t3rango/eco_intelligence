"use client"

import { useOptimistic, useState, useTransition, useRef } from "react"
import { toggleTask, addTask } from "@/app/actions/posts"
import type { YardTask } from "@/lib/queries"
import { GOALS, type GoalKey } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Check, Plus, Sprout, PartyPopper } from "lucide-react"

function goalChip(category: string | null) {
  if (!category) return null
  return GOALS.find((g) => g.key === (category as GoalKey)) ?? null
}

export function ActionPlan({
  postId,
  tasks,
  canEdit,
  filterGoal = null,
}: {
  postId: number
  tasks: YardTask[]
  canEdit: boolean
  filterGoal?: GoalKey | null
}) {
  const [optimisticTasks, setOptimistic] = useOptimistic(
    tasks,
    (state: YardTask[], update: { id: number; done: boolean }) =>
      state.map((t) => (t.id === update.id ? { ...t, done: update.done } : t)),
  )
  const [, startTransition] = useTransition()

  // Progress always reflects ALL tasks; the filter only changes what's shown.
  const total = optimisticTasks.length
  const done = optimisticTasks.filter((t) => t.done).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total
  const visibleTasks = filterGoal ? optimisticTasks.filter((t) => t.category === filterGoal) : optimisticTasks

  function onToggle(task: YardTask) {
    if (!canEdit) return
    startTransition(async () => {
      setOptimistic({ id: task.id, done: !task.done })
      await toggleTask(task.id, !task.done)
    })
  }

  return (
    <div className="shadow-soft rounded-organic border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-leaf bg-primary/15 text-primary">
            <Sprout className="h-4 w-4" />
          </span>
          Your action plan
        </h3>
        <span className="rounded-full bg-lime/20 px-2.5 py-1 text-sm font-bold tabular-nums text-foreground">
          {done}/{total}
        </span>
      </div>

      <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {allDone ? (
        <div className="bg-bloom animate-pop glow-accent mb-3 flex items-center gap-2 rounded-2xl border border-lime/30 px-3.5 py-3 text-sm font-bold text-foreground">
          <PartyPopper className="h-4 w-4 text-primary" />
          Every step done — your yard just got more alive!
        </div>
      ) : null}

      <ul className="space-y-2">
        {visibleTasks.map((task) => {
          const goal = goalChip(task.category)
          return (
            <li key={task.id}>
              <button
                onClick={() => onToggle(task)}
                disabled={!canEdit}
                className={cn(
                  "flex w-full items-start gap-3 rounded-organic border border-border/50 p-3 text-left transition-colors",
                  canEdit && "hover:border-primary/30 hover:bg-secondary/40",
                  !canEdit && "cursor-default",
                  task.done && "opacity-60",
                )}
                aria-pressed={task.done}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                    task.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {task.done ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold leading-snug transition-colors",
                        task.done ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {task.label}
                    </span>
                    {goal ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {goal.emoji} {goal.label}
                      </span>
                    ) : null}
                    {task.impact ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold capitalize text-secondary-foreground">
                        {task.impact} impact
                      </span>
                    ) : null}
                  </span>
                  {task.detail && !task.done ? (
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{task.detail}</span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {canEdit ? <AddStep postId={postId} /> : null}
    </div>
  )
}

function AddStep({ postId }: { postId: number }) {
  const [value, setValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const label = value.trim()
    if (!label) return
    setValue("")
    startTransition(async () => {
      await addTask(postId, label)
    })
  }

  return (
    <form onSubmit={submit} className="mt-3 flex items-center gap-2 border-t border-border/70 pt-3">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add your own step…"
        disabled={isPending}
        className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={isPending || !value.trim()}
        className="glow-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
        aria-label="Add step"
      >
        <Plus className="h-4 w-4" />
      </button>
    </form>
  )
}
