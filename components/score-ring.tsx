import { cn } from "@/lib/utils"

function scoreColor(score: number) {
  if (score >= 80) return "text-primary"
  if (score >= 55) return "text-accent"
  if (score >= 30) return "text-chart-4"
  return "text-muted-foreground"
}

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
  const gid = `ring-grad-${size}-${stroke}`

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="60%" stopColor="oklch(0.66 0.16 110)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
          stroke={`url(#${gid})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-serif text-2xl font-bold leading-none", scoreColor(clamped))}>{clamped}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
