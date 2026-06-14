import { Bug, Bird, Sun, Layers, Apple, Droplets } from "lucide-react"
import { Leaf } from "@/components/botanical"

const METRICS = [
  { key: "biodiversity", label: "Biodiversity", icon: Bird, chip: "bg-primary/12 text-primary" },
  { key: "pollinator", label: "Pollinators", icon: Bug, chip: "bg-grape/12 text-grape" },
  { key: "sunlight", label: "Sunlight", icon: Sun, chip: "bg-accent text-accent-foreground" },
  { key: "soil", label: "Soil Health", icon: Layers, chip: "bg-coral/12 text-coral" },
  { key: "food", label: "Food", icon: Apple, chip: "bg-jade/12 text-jade" },
  { key: "water", label: "Water", icon: Droplets, chip: "bg-cyan/12 text-cyan" },
] as const

type Scores = {
  biodiversity: number
  pollinator: number
  sunlight: number
  soil: number
  food: number
  water: number
}

/**
 * Growth-as-data: each metric is a "vine" that grows toward 100, with a leaf
 * budding at the growing tip. Bars are all the brand green for cohesion; the
 * category color lives in the icon chip.
 */
export function MetricBars({ scores, columns = 2 }: { scores: Scores; columns?: 1 | 2 }) {
  return (
    <div className={columns === 2 ? "grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2" : "flex flex-col gap-3.5"}>
      {METRICS.map((m) => {
        const value = Math.max(0, Math.min(100, scores[m.key]))
        const Icon = m.icon
        return (
          <div key={m.key} className="flex items-center gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-leaf ${m.chip}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{m.label}</span>
                <span className="text-sm font-bold tabular-nums text-primary">{value}</span>
              </div>
              <div className="relative h-2.5 w-full rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${value}%` }}
                />
                {/* leaf budding at the growing tip */}
                <Leaf
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 text-primary transition-all duration-700"
                  style={{ left: `calc(${value}% - 6px)` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
