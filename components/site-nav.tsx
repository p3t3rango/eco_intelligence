"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Home, Trophy, Sprout, User, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type NavUser = {
  displayName: string
  handle: string
  avatarUrl: string | null
}

const links = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/grow", label: "Analyze", icon: Sprout },
]

const mobileLinks = [...links, { href: "/profile", label: "Profile", icon: User }]

export function SiteNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-transform duration-300 group-hover:rotate-6">
            <Image src="/leaf-mark.png" alt="" width={24} height={24} className="h-6 w-6" />
          </span>
          <span className="font-serif text-lg font-semibold leading-none tracking-tight">
            <span className="text-gradient">Ecological</span>
            <span className="text-foreground">Intelligence</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active = pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border/50 py-2 sm:hidden">
        {mobileLinks.map((link) => {
          const active = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl px-4 py-1 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                  active && "bg-primary/12 ring-1 ring-primary/25",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
