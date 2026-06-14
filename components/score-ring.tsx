import { cn } from "@/lib/utils"
import { Sprout } from "@/components/botanical"

function scoreColor(score: number) {
  if (score >= 80) return "text-primary"
  if (score >= 55) return "text-jade"
  if (score >= 30) return "text-coral"
  return "text-muted-foreground"
}

/**
 * "Rings of life" — the regen score drawn as tree-growth rings: faint
 * concentric rings inside, the score as the outer growth arc, and a sprout
 * at the heart. A solarpunk growth-as-data take on a progress ring.
 */
export function ScoreRing({
  score,
  size = 88,
  stroke = 8,
  label = "Regen",
}: {
  score: number
  size?: number
  stroke?: number
  label?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circumference - (clamped / 100) * circumference
  const center = size / 2

  // inner tree-rings (decorative growth rings)
  const innerRings = [radius - stroke - 2, radius - stroke * 2 - 5].filter((r) => r > 6)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {innerRings.map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            strokeWidth={1}
            className="stroke-primary/15"
          />
        ))}
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Sprout className="mb-0.5 h-3 w-3 text-primary/50" style={{ width: size * 0.13, height: size * 0.13 }} />
        <span className={cn("font-serif text-2xl font-semibold leading-none", scoreColor(clamped))}>{clamped}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
