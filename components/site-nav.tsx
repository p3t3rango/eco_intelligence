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

export function SiteNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/leaf-mark.png" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-serif text-lg font-semibold leading-none text-foreground">
            Ecological<span className="text-primary">Intelligence</span>
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
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
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
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border/60 bg-background/95 py-2 backdrop-blur-md sm:hidden">
        {links.map((link) => {
          const active = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-4 py-1 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg px-4 py-1 text-xs font-medium",
            pathname === "/profile" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <User className="h-5 w-5" />
          Profile
        </Link>
      </nav>
    </header>
  )
}
