"use client"

import { GOALS, type GoalKey } from "@/lib/types"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function GoalPicker({
  value,
  onChange,
}: {
  value: GoalKey[]
  onChange: (next: GoalKey[]) => void
}) {
  function toggle(key: GoalKey) {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {GOALS.map((g) => {
        const selected = value.includes(g.key)
        return (
          <button
            key={g.key}
            type="button"
            onClick={() => toggle(g.key)}
            aria-pressed={selected}
            className={cn(
              "rounded-organic group relative flex items-start gap-3 border-2 p-3.5 text-left transition-all",
              selected
                ? "border-primary bg-primary/10 shadow-soft"
                : "border-border/60 bg-card hover:border-primary/40",
            )}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {g.emoji}
            </span>
            <span className="flex-1">
              <span className="block font-serif text-base font-semibold text-foreground">{g.label}</span>
              <span className="block text-xs text-muted-foreground">{g.blurb}</span>
            </span>
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
