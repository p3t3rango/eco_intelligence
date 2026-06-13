import { Bug, Bird, Sun, Layers, Apple, Droplets } from "lucide-react"

const METRICS = [
  { key: "biodiversity", label: "Biodiversity", icon: Bird },
  { key: "pollinator", label: "Pollinators", icon: Bug },
  { key: "sunlight", label: "Sunlight", icon: Sun },
  { key: "soil", label: "Soil Health", icon: Layers },
  { key: "food", label: "Food", icon: Apple },
  { key: "water", label: "Water", icon: Droplets },
] as const

type Scores = {
  biodiversity: number
  pollinator: number
  sunlight: number
  soil: number
  food: number
  water: number
}

export function MetricBars({ scores, columns = 2 }: { scores: Scores; columns?: 1 | 2 }) {
  return (
    <div className={columns === 2 ? "grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2" : "flex flex-col gap-3"}>
      {METRICS.map((m) => {
        const value = scores[m.key]
        const Icon = m.icon
        return (
          <div key={m.key} className="flex items-center gap-3">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{m.label}</span>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-all duration-700"
                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
