import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getComments, getPost } from "@/lib/queries"
import type { YardAnalysis } from "@/lib/types"
import { SiteNav } from "@/components/site-nav"
import { ScoreRing } from "@/components/score-ring"
import { MetricBars } from "@/components/metric-bars"
import { AnalysisPanel } from "@/components/analysis-panel"
import { CommentsSection } from "@/components/comments-section"
import { LikeButton } from "@/components/like-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Sparkles, ArrowLeft } from "lucide-react"

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const postId = Number(id)
  if (Number.isNaN(postId)) notFound()

  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  const me = await ensureProfile()

  const post = await getPost(postId, session.user.id)
  if (!post) notFound()
  const comments = await getComments(postId)
  const analysis = post.analysis as YardAnalysis | null

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <SiteNav
        user={{
          displayName: me?.displayName ?? "Gardener",
          handle: me?.handle ?? "gardener",
          avatarUrl: me?.avatarUrl ?? null,
        }}
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 p-4">
            <Link href={`/u/${post.author.handle}`}>
              <Avatar className="h-11 w-11 border border-border">
                <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.displayName} />
                <AvatarFallback>{post.author.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/u/${post.author.handle}`} className="block font-medium text-foreground">
                {post.author.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">@{post.author.handle}</span>
            </div>
            {post.climateZone ? <Badge variant="outline">{post.climateZone}</Badge> : null}
          </div>

          <Image
            src={post.imageUrl || "/placeholder.svg"}
            alt={post.caption ?? "Yard photo"}
            width={900}
            height={675}
            className="aspect-[4/3] w-full object-cover"
          />

          <div className="space-y-6 p-5">
            <div className="flex items-center gap-4">
              <ScoreRing score={post.regenScore} size={96} />
              <div className="flex-1">
                <h1 className="font-serif text-xl font-semibold text-foreground">Regenerative Score</h1>
                <p className="text-sm text-muted-foreground">
                  Average across six ecological dimensions of this space.
                </p>
                {post.locationLabel ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {post.locationLabel}
                  </div>
                ) : null}
              </div>
            </div>

            {post.caption ? (
              <p className="text-pretty leading-relaxed text-foreground">{post.caption}</p>
            ) : null}

            {analysis?.summary ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Ecological Read
                </div>
                <p className="text-pretty leading-relaxed text-foreground/90">{analysis.summary}</p>
              </div>
            ) : null}

            <MetricBars scores={post.scores} />

            <div className="border-t border-border pt-4">
              <LikeButton postId={post.id} initialLiked={post.likedByMe} initialCount={post.likeCount} />
            </div>

            {analysis ? <AnalysisPanel analysis={analysis} /> : null}
          </div>
        </div>

        <div className="mt-6">
          <CommentsSection postId={post.id} comments={comments} />
        </div>
      </main>
    </div>
  )
}
