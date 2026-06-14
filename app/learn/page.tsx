import type { Metadata } from "next"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { SiteNav } from "@/components/site-nav"
import { BranchDivider, LeafSpray, Sprout } from "@/components/botanical"
import { ExternalLink, BookOpen, Leaf, Sparkles, ShieldAlert, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Learn — The Anima Commune",
  description:
    "A curated, beginner-friendly path into herbalism, mycology, and native plants — with trusted resources and safety guidance.",
}

type Resource = { name: string; desc: string; url: string }
type Section = { key: string; title: string; blurb: string; icon: React.ElementType; tint: string; resources: Resource[] }

const SECTIONS: Section[] = [
  {
    key: "herbalism",
    title: "Herbalism",
    blurb: "Evidence-based starting points for working with medicinal & culinary plants.",
    icon: Leaf,
    tint: "bg-primary/12 text-primary",
    resources: [
      { name: "NIH NCCIH — Herbs at a Glance", desc: "Plain-language, evidence-based profiles of common herbs, including what the science says and safety notes.", url: "https://www.nccih.nih.gov/health/herbsataglance" },
      { name: "Memorial Sloan Kettering — About Herbs", desc: "A searchable database of herb monographs with clinical evidence and interactions, written by pharmacists.", url: "https://www.mskcc.org/cancer-care/diagnosis-treatment/symptom-management/integrative-medicine/herbs" },
      { name: "Book — Rosemary Gladstar, “Medicinal Herbs: A Beginner's Guide”", desc: "A gentle, practical introduction to growing and using 33 common healing herbs.", url: "https://www.storey.com/books/medicinal-herbs/" },
    ],
  },
  {
    key: "mycology",
    title: "Mycology",
    blurb: "Fungi are fascinating — and some are deadly. Start with community and identification, never with a plate.",
    icon: Sparkles,
    tint: "bg-grape/12 text-grape",
    resources: [
      { name: "North American Mycological Association", desc: "Find a local mushroom club, forays, and expert identifiers near you — the safest way to learn fungi.", url: "https://www.namyco.org/" },
      { name: "Mushroom Observer", desc: "A community archive of real fungus observations you can browse, compare, and learn identification from.", url: "https://mushroomobserver.org/" },
      { name: "iNaturalist — Fungi", desc: "Log what you find and get community ID help; see what fungi are observed near you.", url: "https://www.inaturalist.org/taxa/47170-Fungi" },
    ],
  },
  {
    key: "native",
    title: "Native plants & restoration",
    blurb: "What belongs where — and how to bring it back.",
    icon: Sprout,
    tint: "bg-jade/12 text-jade",
    resources: [
      { name: "USDA PLANTS Database", desc: "Authoritative native status, range maps, and characteristics for plants across the U.S.", url: "https://plants.usda.gov/" },
      { name: "Lady Bird Johnson Wildflower Center", desc: "A native-plant database and how-to guides for gardening with native species by region.", url: "https://www.wildflower.org/" },
      { name: "United Plant Savers", desc: "Which native medicinal plants are at-risk — and how your garden can help protect them.", url: "https://unitedplantsavers.org/" },
    ],
  },
]

export default async function LearnPage() {
  // Public page — show the nav with the user if signed in, otherwise as a guest.
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
        <header className="mb-7 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-leaf bg-primary/10 text-primary">
            <LeafSpray className="h-9 w-9" />
          </span>
          <p className="flex items-center justify-center gap-1.5 text-sm font-bold uppercase tracking-wide text-primary">
            <BookOpen className="h-4 w-4" /> Field notes
          </p>
          <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-foreground">Learn the living world</h1>
          <p className="mx-auto mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
            A beginner&apos;s path into herbalism, mycology, and native plants — bringing the soul of the land into your
            everyday life. We point you to the most trusted sources so you can go deep, safely.
          </p>
          <BranchDivider className="mx-auto mt-4 h-3 w-40 text-primary/30" />
        </header>

        {/* Safety first — persistent and prominent */}
        <div className="rounded-organic mb-7 flex gap-3 border-2 border-clay/40 bg-clay/5 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-clay" />
          <div>
            <p className="text-sm font-bold text-foreground">Learn before you harvest</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              This is educational, not medical advice. <strong className="text-foreground">Never eat or apply any wild
              plant or fungus</strong> without confident, expert identification — many have toxic, even deadly,
              look-alikes. When in doubt, leave it and ask a local expert.
            </p>
          </div>
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

          {/* Community nudge */}
          <section className="rounded-organic bg-leaf-dots border border-primary/20 bg-card/60 p-5 text-center shadow-soft">
            <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-leaf bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <h2 className="font-serif text-xl font-semibold text-foreground">Learn by doing — and together</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              The best teacher is your own patch of earth. Analyze your yard to see what already grows there, then share
              it with the commune.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
