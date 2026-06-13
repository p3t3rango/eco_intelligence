import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { SiteNav } from "@/components/site-nav"
import { GrowUploader } from "@/components/grow-uploader"
import { Sprout } from "lucide-react"

export default async function GrowPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  const profile = await ensureProfile()

  return (
    <div className="min-h-dvh pb-32 sm:pb-0">
      <SiteNav
        user={{
          displayName: profile?.displayName ?? "Gardener",
          handle: profile?.handle ?? "gardener",
          avatarUrl: profile?.avatarUrl ?? null,
        }}
      />
      <main className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sprout className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Analyze your yard</h1>
            <p className="text-sm text-muted-foreground">
              AI reads sunlight, biodiversity, pollinators, soil, food &amp; water.
            </p>
          </div>
        </div>
        <GrowUploader defaultLocation={profile?.locationLabel ?? ""} />
      </main>
    </div>
  )
}
