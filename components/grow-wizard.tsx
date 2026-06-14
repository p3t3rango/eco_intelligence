"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createReading, generatePlan } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MetricBars } from "@/components/metric-bars"
import { GoalPicker } from "@/components/goal-picker"
import { LeafSpray } from "@/components/botanical"
import type { GoalKey, YardReading } from "@/lib/types"
import { Camera, ImagePlus, Loader2, Lock, MapPin, Sparkles, X, ArrowRight, Eye, Target } from "lucide-react"

type Step = "capture" | "read" | "goals"

const STEPS: { key: Step; label: string; icon: typeof Camera }[] = [
  { key: "capture", label: "Capture", icon: Camera },
  { key: "read", label: "The Read", icon: Eye },
  { key: "goals", label: "Your Goals", icon: Target },
]

export function GrowWizard({ defaultLocation }: { defaultLocation: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("capture")
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState(defaultLocation)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [postId, setPostId] = useState<number | null>(null)
  const [reading, setReading] = useState<YardReading | null>(null)
  const [detected, setDetected] = useState<string[]>([])
  const [newItem, setNewItem] = useState("")
  const [goals, setGoals] = useState<GoalKey[]>([])

  const [converting, setConverting] = useState(false)

  function isHeic(f: File) {
    return /image\/heic|image\/heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name)
  }

  // Downscale large phone photos before upload — faster upload, faster AI,
  // lower cost, and no blank-while-optimizing on the post page.
  async function downscale(f: File, max = 1600, quality = 0.82): Promise<File> {
    try {
      const bitmap = await createImageBitmap(f)
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
      if (scale === 1 && f.size < 1_500_000) return f
      const w = Math.round(bitmap.width * scale)
      const h = Math.round(bitmap.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, w, h)
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality))
      if (!blob) return f
      return new File([blob], f.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })
    } catch {
      return f
    }
  }

  async function handleFile(selected: File | null) {
    if (!selected) return
    setError(null)

    // Phones often produce HEIC, which browsers can't decode/display and
    // Gemini won't accept — convert to JPEG client-side first.
    if (isHeic(selected)) {
      setConverting(true)
      try {
        const heic2any = (await import("heic2any")).default
        const out = (await heic2any({ blob: selected, toType: "image/jpeg", quality: 0.9 })) as Blob
        const jpeg = new File([out], selected.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" })
        const small = await downscale(jpeg)
        setFile(small)
        setPreview(URL.createObjectURL(small))
      } catch {
        setError("We couldn't read that HEIC photo. Try a JPG or PNG, or change your phone's camera format to 'Most Compatible'.")
      } finally {
        setConverting(false)
      }
      return
    }

    const small = await downscale(selected)
    setFile(small)
    setPreview(URL.createObjectURL(small))
  }

  function reset() {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  function runReading() {
    if (!file) {
      setError("Please add a photo first.")
      return
    }
    setError(null)
    const fd = new FormData()
    fd.append("image", file)
    fd.append("title", title)
    fd.append("caption", caption)
    fd.append("locationLabel", location)
    startTransition(async () => {
      const result = await createReading(fd)
      if (result.ok) {
        setPostId(result.postId)
        setReading(result.reading)
        setDetected(result.reading.detected)
        setStep("read")
      } else {
        setError(result.error)
      }
    })
  }

  function buildPlan() {
    if (!postId || goals.length === 0) {
      setError("Pick at least one goal.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await generatePlan(postId, goals, detected)
      if (result.ok) {
        router.push(`/post/${postId}`)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  const activeIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const done = i < activeIndex
          const active = i === activeIndex
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </span>
              {i < STEPS.length - 1 ? <span className="h-px w-4 bg-border" /> : null}
            </li>
          )
        })}
      </ol>

      {/* ── Step 1: Capture ── */}
      {step === "capture" && (
        <div className="space-y-5">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />

          {preview ? (
            <div className="shadow-lift animate-pop rounded-organic-lg relative overflow-hidden border border-primary/30">
              <Image src={preview} alt="Selected yard" width={800} height={600} className="aspect-[4/3] w-full object-cover" unoptimized />
              {!isPending && (
                <button onClick={reset} className="glass absolute right-3 top-3 rounded-full p-2 text-foreground transition-transform active:scale-95" aria-label="Remove photo">
                  <X className="h-4 w-4" />
                </button>
              )}
              {isPending && (
                <div className="bg-bloom absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                  <Loader2 className="h-9 w-9 animate-spin text-primary" />
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" /> Reading the ecology of your land…
                  </p>
                </div>
              )}
            </div>
          ) : converting ? (
            <div className="bg-bloom rounded-organic-lg flex flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/40 p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-semibold text-foreground">Converting your photo…</p>
            </div>
          ) : (
            <div className="bg-bloom bg-leaf-dots animate-rise rounded-organic-lg grid grid-cols-2 gap-3 border-2 border-dashed border-primary/40 p-3">
              <button onClick={() => cameraInputRef.current?.click()} className="lift rounded-organic flex flex-col items-center gap-2.5 border border-primary/15 bg-card/80 p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <span className="flex h-12 w-12 items-center justify-center rounded-leaf bg-primary/10 text-primary"><Camera className="h-6 w-6" /></span>
                <span className="text-sm font-bold">Take photo</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="lift rounded-organic flex flex-col items-center gap-2.5 border border-primary/15 bg-card/80 p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <span className="flex h-12 w-12 items-center justify-center rounded-leaf bg-accent text-accent-foreground"><ImagePlus className="h-6 w-6" /></span>
                <span className="text-sm font-bold">Upload</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Name this spot</Label>
            <Input id="title" placeholder="Back garden, front yard, balcony…" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caption">Notes (optional)</Label>
            <Textarea id="caption" placeholder="What did you plant, change, or notice?" value={caption} onChange={(e) => setCaption(e.target.value)} disabled={isPending} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location</Label>
            <Input id="location" placeholder="City, state or ZIP (grounds tips to your area)" value={location} onChange={(e) => setLocation(e.target.value)} disabled={isPending} />
          </div>

          {error ? <ErrorPill>{error}</ErrorPill> : null}

          <Button onClick={runReading} disabled={isPending || converting || !file} size="lg" className="glow-primary w-full rounded-2xl text-base font-bold">
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading…</> : <><Eye className="h-4 w-4" /> Read my yard</>}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Saved privately to your yard. Share anytime.
          </p>
        </div>
      )}

      {/* ── Step 2: The Read ── */}
      {step === "read" && reading && (
        <div className="animate-rise space-y-5">
          {preview ? (
            <div className="rounded-organic-lg relative overflow-hidden shadow-soft">
              <Image src={preview} alt="Your yard" width={800} height={600} className="aspect-[4/3] w-full object-cover" unoptimized />
            </div>
          ) : null}

          <div className="rounded-organic bg-card border-2 border-border/60 p-4 shadow-soft">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary"><Eye className="h-4 w-4" /> Here&apos;s what we see</p>
            <p className="mt-2 text-pretty leading-relaxed text-foreground">{reading.summary}</p>
          </div>

          <div className="rounded-organic bg-card border-2 border-border/60 p-4 shadow-soft">
            <p className="mb-3 font-serif text-lg font-semibold">Ecological read</p>
            <MetricBars scores={reading.scores} columns={2} />
          </div>

          <div className="rounded-organic bg-card border-2 border-border/60 p-4 shadow-soft">
            <p className="text-sm font-bold text-foreground">What&apos;s in your space</p>
            <p className="mb-2.5 text-xs text-muted-foreground">Remove anything we got wrong — it shapes your plan.</p>
            <div className="flex flex-wrap gap-2">
              {detected.map((d) => (
                <span key={d} className="group inline-flex items-center gap-1.5 rounded-full bg-secondary py-1 pl-3 pr-1.5 text-xs font-semibold text-secondary-foreground">
                  {d}
                  <button
                    type="button"
                    onClick={() => setDetected((prev) => prev.filter((x) => x !== d))}
                    aria-label={`Remove ${d}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const v = newItem.trim()
                if (v && !detected.includes(v)) setDetected((prev) => [...prev, v])
                setNewItem("")
              }}
            >
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add something we missed…"
                className="h-9 text-sm"
              />
              <Button type="submit" variant="outline" size="sm" className="rounded-xl" disabled={!newItem.trim()}>
                Add
              </Button>
            </form>
          </div>

          {reading.wildlife.length > 0 && (
            <div className="rounded-organic bg-card border-2 border-border/60 p-4 shadow-soft">
              <p className="mb-2 text-sm font-bold text-foreground">Wildlife it could support</p>
              <div className="flex flex-wrap gap-2">
                {reading.wildlife.map((w) => (
                  <span key={w} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{w}</span>
                ))}
              </div>
            </div>
          )}

          {error ? <ErrorPill>{error}</ErrorPill> : null}

          <Button onClick={() => { setError(null); setStep("goals") }} size="lg" className="glow-primary w-full rounded-2xl text-base font-bold">
            Now, what do you want? <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Step 3: Goals ── */}
      {step === "goals" && (
        <div className="animate-rise space-y-5">
          <div className="text-center">
            <span className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-leaf bg-primary/10 text-primary"><LeafSpray className="h-8 w-8" /></span>
            <h2 className="font-serif text-2xl font-semibold">What do you want this space to become?</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Pick any that fit. We&apos;ll tailor the plan — and the reasons behind it — to your goals and your local ecology.</p>
          </div>

          <GoalPicker value={goals} onChange={setGoals} />

          {error ? <ErrorPill>{error}</ErrorPill> : null}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setError(null); setStep("read") }} disabled={isPending} className="rounded-2xl">Back</Button>
            <Button onClick={buildPlan} disabled={isPending || goals.length === 0} size="lg" className="glow-primary flex-1 rounded-2xl text-base font-bold">
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Building your plan…</> : <><Sparkles className="h-4 w-4" /> Build my plan{goals.length ? ` (${goals.length})` : ""}</>}
            </Button>
          </div>
          {isPending ? (
            <p className="text-center text-xs text-muted-foreground">Pulling real local species data and grounding every suggestion to your area…</p>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ErrorPill({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
      {children}
    </p>
  )
}
