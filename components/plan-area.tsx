"use client"

import { useState } from "react"
import { ActionPlan } from "@/components/action-plan"
import { PlanDetails } from "@/components/analysis-panel"
import { GOALS, type GoalKey, type YardAnalysis } from "@/lib/types"
import type { YardTask } from "@/lib/queries"
import { cn } from "@/lib/utils"

/**
 * The Plan area with a goal filter. Tapping a goal chip narrows the action
 * steps and plant picks to that goal; "All" shows everything. The action-plan
 * progress always reflects the full list.
 */
export function PlanArea({
  postId,
  isOwner,
  goals,
  tasks,
  analysis,
}: {
  postId: number
  isOwner: boolean
  goals: GoalKey[]
  tasks: YardTask[]
  analysis: YardAnalysis
}) {
  const [active, setActive] = useState<GoalKey | null>(null)
  const showFilter = goals.length > 1

  return (
    <div className="space-y-5">
      {showFilter ? (
        <div className="flex flex-wrap items-center gap-2">
          <Chip label="All" active={active === null} onClick={() => setActive(null)} />
          {goals.map((g) => {
            const meta = GOALS.find((x) => x.key === g)
            return (
              <Chip
                key={g}
                label={`${meta?.emoji ?? ""} ${meta?.label ?? g}`}
                active={active === g}
                onClick={() => setActive(active === g ? null : g)}
              />
            )
          })}
        </div>
      ) : null}

      {isOwner ? <ActionPlan postId={postId} tasks={tasks} canEdit filterGoal={active} /> : null}

      <PlanDetails
        analysis={analysis}
        hideRecommendations={isOwner}
        filterGoal={active}
        postId={postId}
        canDismiss={isOwner}
      />
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}
