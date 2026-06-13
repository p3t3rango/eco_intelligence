import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getComments, getPost, getTasks } from "@/lib/queries"
import type { YardAnalysis } from "@/lib/types"
import { SiteNav } from "@/components/site-nav"
import { ScoreRing } from "@/components/score-ring"
import { MetricBars } from "@/components/metric-bars"
import { AnalysisPanel } from "@/components/analysis-panel"
import { ActionPlan } from "@/components/action-plan"
import { ShareToggle } from "@/components/share-toggle"
import { CommentsSection } from "@/components/comments-section"
import { LikeButton } from "@/components/like-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Sparkles, ArrowLeft, Globe, Lock } from "lucide-react"

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const postId = Number(id)
  if (Number.isNaN(postId)) notFound()

  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  const me = await ensureProfile()

  const post = await getPost(postId, session.user.id)
  if (!post) notFound()

  const isOwner = post.author.userId === session.user.id
  // Privacy guard: private yards are only visible to their owner.
  if (!post.isShared && !isOwner) notFound()

  const [comments, tasks] = await Promise.all([getComments(postId), getTasks(postId)])
  const analysis = post.analysis as YardAnalysis | null

  return (
    <div className="min-h-dvh pb-24 sm:pb-0">
      <SiteNav
        user={{
          displayName: me?.displayName ?? "Gardener",
          handle: me?.handle ?? "gardener",
          avatarUrl: me?.avatarUrl ?? null,
        }}
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href={isOwner ? "/" : "/community"}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {isOwner ? "Back to my yard" : "Back to community"}
        </Link>

        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
          <div className="flex items-center gap-3 p-4">
            <Link href={`/u/${post.author.handle}`}>
              <Avatar className="h-11 w-11 border border-border">
                <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.displayName} />
                <AvatarFallback>{post.author.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/u/${post.author.handle}`} className="block font-medium text-foreground">
                {isOwner ? "You" : post.author.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">@{post.author.handle}</span>
            </div>
            {isOwner ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  post.isShared
                    ? "bg-primary/12 text-primary ring-1 ring-primary/25"
                    : "bg-muted text-muted-foreground ring-1 ring-border"
                }`}
              >
                {post.isShared ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {post.isShared ? "Shared" : "Private"}
              </span>
            ) : post.climateZone ? (
              <Badge variant="outline">{post.climateZone}</Badge>
            ) : null}
          </div>

          <Image
            src={post.imageUrl || "/placeholder.svg"}
            alt={post.title ?? post.caption ?? "Yard photo"}
            width={900}
            height={675}
            className="aspect-[4/3] w-full object-cover"
          />

          <div className="space-y-6 p-5">
            {post.title ? (
              <h1 className="-mb-3 font-serif text-2xl font-semibold leading-tight text-foreground text-balance">
                {post.title}
              </h1>
            ) : null}

            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <ScoreRing score={post.regenScore} size={80} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-lg font-semibold leading-tight text-foreground sm:text-xl">
                    Regenerative Score
                  </h2>
                  {post.locationLabel ? (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{post.locationLabel}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                Average across six ecological dimensions of this space.
              </p>
            </div>

            {post.caption ? <p className="text-pretty leading-relaxed text-foreground">{post.caption}</p> : null}

            {analysis?.summary ? (
              <div className="bg-bloom rounded-2xl border border-primary/15 p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-primary">
                  <Sparkles className="h-4 w-4" />
                  Ecological Read
                </div>
                <p className="text-pretty leading-relaxed text-foreground/90">{analysis.summary}</p>
              </div>
            ) : null}

            <MetricBars scores={post.scores} />

            {/* Owner sees a trackable action plan; visitors see read-only steps. */}
            {isOwner ? (
              <ActionPlan postId={post.id} tasks={tasks} canEdit />
            ) : null}

            {analysis ? <AnalysisPanel analysis={analysis} hideRecommendations={isOwner} /> : null}

            {/* Sharing control for the owner */}
            {isOwner ? (
              <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  {post.isShared
                    ? "This yard is visible in the community feed and counts toward the leaderboard."
                    : "Only you can see this yard. Share it to get feedback and join the leaderboard."}
                </p>
                <ShareToggle postId={post.id} initialShared={post.isShared} />
              </div>
            ) : (
              <div className="border-t border-border pt-4">
                <LikeButton postId={post.id} initialLiked={post.likedByMe} initialCount={post.likeCount} />
              </div>
            )}
          </div>
        </div>

        {/* Comments: feedback from the community (owner can read replies too). */}
        {post.isShared ? (
          <div className="mt-6">
            <CommentsSection postId={post.id} comments={comments} />
          </div>
        ) : null}
      </main>
    </div>
  )
}
