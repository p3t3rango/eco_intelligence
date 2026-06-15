import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getAllPosts, getPost } from "@/lib/posts"
import { SiteNav } from "@/components/site-nav"
import { BranchDivider } from "@/components/botanical"
import { ArrowLeft, Clock } from "lucide-react"

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: "Field Notes — The Anima Commune" }
  return { title: `${post.title} — The Anima Commune`, description: post.excerpt }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

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

        <article className="animate-rise">
          <header className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">{post.category}</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" /> {post.readingTime} min read
              </span>
            </div>
            <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance">
              {post.title}
            </h1>
            <p className="mt-3 text-pretty text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">By {post.author}</p>
            <BranchDivider className="mt-5 h-3 w-40 text-primary/30" />
          </header>

          <div className="prose-note">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </article>
      </main>
    </div>
  )
}
