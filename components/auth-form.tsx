"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn, signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Leaf } from "lucide-react"
import { toast } from "sonner"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const isSignUp = mode === "sign-up"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await signUp.email({ email, password, name })
        if (error) throw new Error(error.message || "Could not create account")
      } else {
        const { error } = await signIn.email({ email, password })
        if (error) throw new Error(error.message || "Could not sign in")
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-sun-rays relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* ambient bloom accents */}
      <div className="bg-primary pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl" aria-hidden />
      <div className="bg-primary pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full opacity-25 blur-3xl" aria-hidden />

      <div className="animate-rise relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="animate-float flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-primary">
            <Leaf className="h-6 w-6" />
          </span>
          <span className="font-serif text-2xl font-extrabold tracking-tight">
            <span className="text-foreground">Ecological</span>
            <span className="text-foreground"> Intelligence</span>
          </span>
        </Link>

        <div className="glass rounded-3xl p-8 shadow-lift">
          <h1 className="font-serif text-4xl font-extrabold leading-[1.05] text-card-foreground text-balance">
            {isSignUp ? "Grow your corner of the planet" : "Welcome back, steward"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isSignUp
              ? "Create an account to analyze your yard and join the regeneration."
              : "Sign in to track your Regenerative Score and community."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Greenfield"
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@garden.earth"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" variant="gradient" disabled={loading} className="mt-2 w-full glow-primary" size="lg">
              {loading ? "Just a moment…" : isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already growing with us? " : "New to the network? "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
