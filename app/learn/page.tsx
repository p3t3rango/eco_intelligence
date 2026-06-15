import type { Metadata } from "next"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getAllPosts } from "@/lib/posts"
import { SiteNav } from "@/components/site-nav"
import { BranchDivider, LeafSpray } from "@/components/botanical"
import { BookOpen, Clock, ArrowRight, ShieldAlert } from "lucide-react"

export const metadata: Metadata = {
  title: "Field Notes — The Anima Commune",
  description:
    "Short, reader-friendly notes on herbalism, mycology, and native plants — and how to bring the living world into your everyday life.",
}

export default async function LearnPage() {
  const session = await getSession()
  const profile = session?.user ? await ensureProfile() : null
  const posts = getAllPosts()

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
            <BookOpen className="h-4 w-4" /> Field Notes
          </p>
          <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-foreground">Notes from the living world</h1>
          <p className="mx-auto mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Short reads on herbalism, mycology, and native plants — how to notice them, learn them safely, and bring them
            into your own patch of earth.
          </p>
          <BranchDivider className="mx-auto mt-4 h-3 w-40 text-primary/30" />
        </header>

        <div className="mb-7 flex items-start gap-3 rounded-organic border border-clay/40 bg-clay/5 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-clay" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            These are educational notes, not medical advice. <strong className="text-foreground">Never eat or apply any
            wild plant or fungus</strong> without confident, expert identification — deadly look-alikes exist.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {posts.map((p, i) => (
            <Link
              key={p.slug}
              href={`/learn/${p.slug}`}
              className="lift rounded-organic animate-rise group block border border-border/70 bg-card p-5 shadow-soft transition-colors hover:border-primary/30"
              style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
            >
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">{p.category}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" /> {p.readingTime} min read
                </span>
              </div>
              <h2 className="font-serif text-xl font-semibold leading-snug text-foreground text-balance">{p.title}</h2>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
