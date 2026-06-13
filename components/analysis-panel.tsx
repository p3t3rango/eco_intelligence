import type { YardAnalysis } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Eye, Leaf, Sprout, Bird, CheckCircle2 } from "lucide-react"

export function AnalysisPanel({ analysis }: { analysis: YardAnalysis }) {
  return (
    <div className="space-y-6">
      {analysis.observations.length > 0 && (
        <Section icon={Eye} title="What the AI sees">
          <ul className="space-y-2">
            {analysis.observations.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {o}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {analysis.recommendations.length > 0 && (
        <Section icon={Sprout} title="Regenerative next steps">
          <ul className="space-y-2.5">
            {analysis.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {analysis.plants.length > 0 && (
        <Section icon={Leaf} title="Plants to consider">
          <div className="space-y-2.5">
            {analysis.plants.map((p, i) => (
              <div key={i} className="rounded-xl border border-border bg-secondary/50 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{p.name}</span>
                  {p.native && (
                    <Badge variant="secondary" className="text-[10px]">
                      Native
                    </Badge>
                  )}
                </div>
                {p.reason ? <p className="mt-0.5 text-sm text-muted-foreground">{p.reason}</p> : null}
              </div>
            ))}
          </div>
        </Section>
      )}

      {analysis.wildlife.length > 0 && (
        <Section icon={Bird} title="Wildlife you could support">
          <div className="flex flex-wrap gap-2">
            {analysis.wildlife.map((w, i) => (
              <Badge key={i} variant="outline">
                {w}
              </Badge>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  )
}
