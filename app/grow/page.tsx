import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/app/actions/profile"
import { SiteNav } from "@/components/site-nav"
import { GrowWizard } from "@/components/grow-wizard"
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
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="animate-rise mb-8 flex items-center gap-4">
          <span className="bg-primary glow-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-primary-foreground">
            <Sprout className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              Meet your yard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              First we read what&apos;s there — then you choose what you want it to become.
            </p>
          </div>
        </div>
        <GrowWizard defaultLocation={profile?.locationLabel ?? ""} />
      </main>
    </div>
  )
}
