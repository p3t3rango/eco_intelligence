import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { getPostsByUser, getProfileStats } from "@/lib/queries"
import { SiteNav } from "@/components/site-nav"
import { ProfileHeader } from "@/components/profile-header"
import { PostGrid } from "@/components/post-grid"
import { EditProfile } from "@/components/edit-profile"

export default async function MyProfilePage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  const profile = await ensureProfile()
  if (!profile) redirect("/sign-in")

  const [stats, posts] = await Promise.all([
    getProfileStats(profile.userId, true),
    getPostsByUser(profile.userId, session.user.id, true),
  ])

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <SiteNav
        user={{ displayName: profile.displayName, handle: profile.handle, avatarUrl: profile.avatarUrl }}
      />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <ProfileHeader
          profile={profile}
          stats={stats}
          action={
            <EditProfile
              profile={{ displayName: profile.displayName, bio: profile.bio, locationLabel: profile.locationLabel }}
            />
          }
        />
        <PostGrid posts={posts} />
      </main>
    </div>
  )
}
