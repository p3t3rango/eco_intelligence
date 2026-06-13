"use client"

import { useOptimistic, useState, useTransition, useRef } from "react"
import { toggleTask, addTask } from "@/app/actions/posts"
import type { YardTask } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { Check, Plus, Sprout, PartyPopper } from "lucide-react"

export function ActionPlan({
  postId,
  tasks,
  canEdit,
}: {
  postId: number
  tasks: YardTask[]
  canEdit: boolean
}) {
  const [optimisticTasks, setOptimistic] = useOptimistic(
    tasks,
    (state: YardTask[], update: { id: number; done: boolean }) =>
      state.map((t) => (t.id === update.id ? { ...t, done: update.done } : t)),
  )
  const [, startTransition] = useTransition()

  const total = optimisticTasks.length
  const done = optimisticTasks.filter((t) => t.done).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  function onToggle(task: YardTask) {
    if (!canEdit) return
    startTransition(async () => {
      setOptimistic({ id: task.id, done: !task.done })
      await toggleTask(task.id, !task.done)
    })
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-foreground">
          <Sprout className="h-4 w-4 text-primary" />
          Your action plan
        </h3>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
          {done}/{total}
        </span>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {allDone ? (
        <div className="bg-bloom mb-3 flex items-center gap-2 rounded-xl border border-primary/15 px-3 py-2.5 text-sm font-medium text-primary">
          <PartyPopper className="h-4 w-4" />
          Every step done — your yard just got more alive!
        </div>
      ) : null}

      <ul className="space-y-1.5">
        {optimisticTasks.map((task) => (
          <li key={task.id}>
            <button
              onClick={() => onToggle(task)}
              disabled={!canEdit}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors",
                canEdit && "hover:bg-secondary",
                !canEdit && "cursor-default",
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
              <span
                className={cn(
                  "text-sm leading-relaxed transition-colors",
                  task.done ? "text-muted-foreground line-through" : "text-foreground/90",
                )}
              >
                {task.label}
              </span>
            </button>
          </li>
        ))}
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
        aria-label="Add step"
      >
        <Plus className="h-4 w-4" />
      </button>
    </form>
  )
}
