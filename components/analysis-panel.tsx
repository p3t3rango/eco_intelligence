"use client"

import Image from "next/image"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { YardAnalysis, GoalKey } from "@/lib/types"
import { GOALS } from "@/lib/types"
import { dismissPlant } from "@/app/actions/posts"
import { Badge } from "@/components/ui/badge"
import { Eye, Leaf, Sprout, Bird, HeartHandshake, Sparkles, X } from "lucide-react"

function goalLabel(key: GoalKey) {
  return GOALS.find((g) => g.key === key)?.label ?? key
}
function goalEmoji(key: GoalKey) {
  return GOALS.find((g) => g.key === key)?.emoji ?? "🌱"
}

/** A scientific binomial like "Echinacea purpurea". */
function looksScientific(s: string) {
  return /^[A-Z][a-z]+ [a-z][a-z-]+/.test(s.trim())
}

/**
 * The AI returns plant names in either order — "Common (Scientific)" or
 * "Scientific (Common)". Split them and always lead with the common name.
 */
function formatPlantName(name: string): { primary: string; secondary: string | null } {
  const m = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (!m) return { primary: name.trim(), secondary: null }
  const [, outside, inside] = m
  if (looksScientific(outside) && !looksScientific(inside)) {
    return { primary: inside.trim(), secondary: outside.trim() }
  }
  return { primary: outside.trim(), secondary: inside.trim() }
}

/** Turn "(c) Jane Doe, some rights reserved (CC BY)" into "Jane Doe". */
function cleanAttribution(attr: string) {
  return attr
    .replace(/^\(c\)\s*/i, "")
    .split(",")[0]
    .trim()
}

// ── Composable sections ──────────────────────────────────────────────────────

/** The grower's chosen goals. */
export function GoalsRow({ goals }: { goals: GoalKey[] }) {
  if (!goals.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your goals</span>
      {goals.map((g) => (
        <span key={g} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {goalEmoji(g)} {goalLabel(g)}
        </span>
      ))}
    </div>
  )
}

/** Part of "The Read": what we see + wildlife it supports. */
export function ReadDetails({ analysis }: { analysis: YardAnalysis }) {
  return (
    <>
      {analysis.observations.length > 0 && (
        <Section icon={Eye} title="What we see" tint="cyan">
          <ul className="space-y-2.5">
            {analysis.observations.map((o, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                {o}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {analysis.wildlife.length > 0 && (
        <Section icon={Bird} title="Wildlife you could support" tint="grape">
          <div className="flex flex-wrap gap-2">
            {analysis.wildlife.map((w, i) => (
              <Badge key={i} variant="outline" className="border-grape/30 bg-grape/10 text-foreground">
                {w}
              </Badge>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

/** Part of "The Plan": grounded recs (optional), local help, plant picks. */
export function PlanDetails({
  analysis,
  hideRecommendations = false,
  filterGoal = null,
  postId,
  canDismiss = false,
}: {
  analysis: YardAnalysis
  hideRecommendations?: boolean
  filterGoal?: GoalKey | null
  postId?: number
  canDismiss?: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const plan = analysis.plan

  const recs = (plan?.recommendations ?? []).filter((r) => !filterGoal || r.goal === filterGoal)
  const plants = (analysis.plants ?? []).filter((p) => !filterGoal || p.goal === filterGoal)

  function dismiss(name: string) {
    if (!postId) return
    startTransition(async () => {
      await dismissPlant(postId, name)
      router.refresh()
    })
  }

  return (
    <>
      {/* Grounded recommendations with their place-specific "why". */}
      {!hideRecommendations && plan && recs.length > 0 && (
        <Section icon={Sprout} title="Your plan" tint="primary">
          <div className="space-y-3">
            {recs.map((r, i) => (
              <div key={i} className="rounded-organic border border-border/70 bg-background/40 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-foreground">{r.title}</p>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {goalEmoji(r.goal)} {goalLabel(r.goal)}
                  </span>
                </div>
                <p className="mt-1 flex gap-1.5 text-sm leading-relaxed text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                  {r.why}
                </p>
                {(r.effort || r.impact) && (
                  <div className="mt-2 flex gap-1.5">
                    {r.impact ? <MiniBadge label={`${r.impact} impact`} /> : null}
                    {r.effort ? <MiniBadge label={`${r.effort} effort`} /> : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Legacy flat recs fallback (older posts with no plan). */}
      {!hideRecommendations && !plan && analysis.recommendations.length > 0 && (
        <Section icon={Sprout} title="Regenerative next steps" tint="primary">
          <ul className="space-y-2.5">
            {analysis.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {plan && plan.localActions.length > 0 && (
        <Section icon={HeartHandshake} title="Help your local ecosystem" tint="grape">
          <div className="space-y-3">
            {plan.localActions.map((a, i) => (
              <div key={i} className="rounded-organic border border-grape/25 bg-grape/5 p-3.5">
                <p className="text-sm font-bold text-foreground">
                  {a.species ? `${a.species}: ` : ""}
                  {a.problem}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.action}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {plants.length > 0 && (
        <Section icon={Leaf} title="Plants to consider" tint="jade">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plants.map((p, i) => {
              const fmt = formatPlantName(p.name)
              return (
                <div key={i} className="rounded-organic group relative overflow-hidden border border-jade/25 bg-card">
                  {canDismiss ? (
                    <button
                      type="button"
                      onClick={() => dismiss(p.name)}
                      aria-label={`Remove ${fmt.primary}`}
                      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-soft backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {p.imageUrl ? (
                    <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
                      <Image src={p.imageUrl} alt={fmt.primary} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover" />
                      {p.imageAttribution ? (
                        <span className="absolute bottom-0 right-0 max-w-full truncate bg-black/45 px-1.5 py-0.5 text-[9px] text-white/90">
                          © {cleanAttribution(p.imageAttribution)}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex aspect-[3/2] w-full items-center justify-center bg-jade/10 text-jade">
                      <Leaf className="h-7 w-7" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-foreground">{fmt.primary}</span>
                      {p.native && (
                        <Badge variant="secondary" className="bg-lime/25 text-[10px] text-foreground">Native</Badge>
                      )}
                      {p.goal ? <span className="text-[10px]">{goalEmoji(p.goal)}</span> : null}
                    </div>
                    {fmt.secondary ? <p className="text-xs italic text-muted-foreground">{fmt.secondary}</p> : null}
                    {p.reason ? <p className="mt-1 text-sm text-muted-foreground">{p.reason}</p> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </>
  )
}

function MiniBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold capitalize text-secondary-foreground">
      {label}
    </span>
  )
}

const tintStyles = {
  primary: "bg-primary/15 text-primary",
  jade: "bg-jade/20 text-jade",
  grape: "bg-grape/15 text-grape",
  cyan: "bg-cyan/20 text-cyan",
} as const

function Section({
  icon: Icon,
  title,
  tint = "primary",
  children,
}: {
  icon: React.ElementType
  title: string
  tint?: keyof typeof tintStyles
  children: React.ReactNode
}) {
  return (
    <div className="shadow-soft rounded-organic border border-border/70 bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-foreground">
        <span className={`flex h-8 w-8 items-center justify-center rounded-leaf ${tintStyles[tint]}`}>
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h3>
      {children}
    </div>
  )
}
