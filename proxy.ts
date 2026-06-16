import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// The branded production domain.
const NEW_HOST = "anima-commune.vercel.app"
// Older hosts that should forward to the new domain (the hackathon-submitted
// URL stays alive — it just redirects here).
const OLD_HOSTS = new Set(["v0-ecointelli.vercel.app", "eco-intelligence.vercel.app"])

// Next.js 16 convention (replaces middleware.ts).
export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase()
  if (OLD_HOSTS.has(host)) {
    const url = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${NEW_HOST}`)
    return NextResponse.redirect(url, 308)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
}
