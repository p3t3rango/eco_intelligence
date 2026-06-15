import type { Metadata } from "next"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { SiteNav } from "@/components/site-nav"
import { BranchDivider } from "@/components/botanical"
import { ExternalLink, Leaf, Sparkles, Sprout, ShieldAlert, ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "The Trusted Shelf — The Anima Commune",
  description: "A vetted, at-a-glance library of the best sources for herbalism, mycology, and native plants.",
}

type Resource = { name: string; desc: string; url: string }
type Section = { key: string; title: string; blurb: string; icon: React.ElementType; tint: string; resources: Resource[] }

const SECTIONS: Section[] = [
  {
    key: "herbalism",
    title: "Herbalism",
    blurb: "Plants can heal and nurture us. Discover which ones resonate with your needs.",
    icon: Leaf,
    tint: "bg-primary/12 text-primary",
    resources: [
      { name: "NIH NCCIH — Herbs at a Glance", desc: "Plain-language, evidence-based profiles of common herbs, with safety notes.", url: "https://www.nccih.nih.gov/health/herbsataglance" },
      { name: "Memorial Sloan Kettering — About Herbs", desc: "Searchable herb monographs with clinical evidence and interactions, written by pharmacists.", url: "https://www.mskcc.org/cancer-care/diagnosis-treatment/symptom-management/integrative-medicine/herbs" },
      { name: "Book — Rosemary Gladstar, “Medicinal Herbs: A Beginner's Guide”", desc: "A gentle introduction to growing and using 33 common healing herbs.", url: "https://www.storey.com/books/medicinal-herbs/" },
    ],
  },
  {
    key: "mycology",
    title: "Mycology",
    blurb: "Fungi are so much more than something to eat — complex beings worth a real relationship. Start with community and ID, never a plate.",
    icon: Sparkles,
    tint: "bg-grape/12 text-grape",
    resources: [
      { name: "North American Mycological Association", desc: "Find a local mushroom club, forays, and expert identifiers near you.", url: "https://www.namyco.org/" },
      { name: "Mushroom Observer", desc: "A community archive of real fungus observations to compare and learn from.", url: "https://mushroomobserver.org/" },
      { name: "iNaturalist — Fungi", desc: "Log finds, get community ID help, and see what fungi are observed near you.", url: "https://www.inaturalist.org/taxa/47170-Fungi" },
    ],
  },
  {
    key: "native",
    title: "Native plants & restoration",
    blurb: "Return to our ancient relationship with the native plants of your place.",
    icon: Sprout,
    tint: "bg-jade/12 text-jade",
    resources: [
      { name: "USDA PLANTS Database", desc: "Authoritative native status, range maps, and characteristics for U.S. plants.", url: "https://plants.usda.gov/" },
      { name: "Lady Bird Johnson Wildflower Center", desc: "A native-plant database and how-to guides for gardening by region.", url: "https://www.wildflower.org/" },
      { name: "United Plant Savers", desc: "Which native medicinal plants are at-risk — and how your garden can help.", url: "https://unitedplantsavers.org/" },
    ],
  },
]

export default async function ResourcesPage() {
  const session = await getSession()
  const profile = session?.user ? await ensureProfile() : null

  return (
    <div className="min-h-dvh pb-24 sm:pb-0">
      <SiteNav
        user={
          profile
            ? { displayName: profile.displayName, handle: profile.handle, avatarUrl: profile.avatarUrl ?? null }
            : null
        }
      />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/learn"
          className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Field Notes
        </Link>

        <header className="mb-7 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">The Trusted Shelf</p>
          <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-foreground">Go deeper, safely</h1>
          <p className="mx-auto mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
            A vetted, at-a-glance library of the best places to learn — the same sources we cite throughout Field Notes.
          </p>
          <BranchDivider className="mx-auto mt-4 h-3 w-40 text-primary/30" />
        </header>

        <div className="mb-7 flex items-start gap-3 rounded-organic border border-clay/40 bg-clay/5 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-clay" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Educational only, not medical advice. <strong className="text-foreground">Never eat or apply any wild plant
            or fungus</strong> without confident, expert identification — deadly look-alikes exist.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            return (
              <section key={s.key} className="rounded-organic border border-border/70 bg-card p-5 shadow-soft">
                <div className="mb-1 flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-leaf ${s.tint}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="font-serif text-xl font-semibold text-foreground">{s.title}</h2>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{s.blurb}</p>
                <ul className="space-y-2.5">
                  {s.resources.map((r) => (
                    <li key={r.url}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lift rounded-organic group flex items-start gap-3 border border-border/50 bg-background/40 p-3.5 transition-colors hover:border-primary/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 font-bold text-foreground">
                            {r.name}
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                          </p>
                          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
