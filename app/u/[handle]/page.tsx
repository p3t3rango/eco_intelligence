import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getPostsByUser, getProfileByHandle, getProfileStats } from "@/lib/queries"
import { SiteNav } from "@/components/site-nav"
import { ProfileHeader } from "@/components/profile-header"
import { PostGrid } from "@/components/post-grid"

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  const me = await ensureProfile()

  // Viewing your own handle? Send to the editable profile.
  if (me?.handle === handle) redirect("/profile")

  const profile = await getProfileByHandle(handle)
  if (!profile) notFound()

  const [stats, posts] = await Promise.all([
    getProfileStats(profile.userId),
    getPostsByUser(profile.userId, session.user.id),
  ])

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <SiteNav
        user={{
          displayName: me?.displayName ?? "Gardener",
          handle: me?.handle ?? "gardener",
          avatarUrl: me?.avatarUrl ?? null,
        }}
      />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <ProfileHeader profile={profile} stats={stats} />
        <PostGrid posts={posts} />
      </main>
    </div>
  )
}
