"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { generateVisualization } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import type { PlantingMarker } from "@/lib/types"
import { Wand2, Map, Image as ImageIcon, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type View = "render" | "map"

export function YardVisualizer({
  postId,
  imageUrl,
  initialRenderUrl,
  initialMarkers,
}: {
  postId: number
  imageUrl: string
  initialRenderUrl: string | null
  initialMarkers: PlantingMarker[] | null
}) {
  const [view, setView] = useState<View>("render")
  const [renderUrl, setRenderUrl] = useState<string | null>(initialRenderUrl)
  const [markers, setMarkers] = useState<PlantingMarker[] | null>(initialMarkers)
  const [active, setActive] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function generate(which: View) {
    setError(null)
    startTransition(async () => {
      const res = await generateVisualization(postId, which)
      if (!res.ok) {
        setError(res.error)
        return
      }
      if (res.view === "render") setRenderUrl(res.renderUrl)
      else {
        setMarkers(res.markers)
        setActive(null)
      }
    })
  }

  const hasContent = view === "render" ? !!renderUrl : !!markers?.length

  return (
    <div className="rounded-organic border border-border/70 bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-leaf bg-primary/15 text-primary">
            <Wand2 className="h-4 w-4" />
          </span>
          See it grown in
        </h3>
        <div className="flex rounded-full bg-secondary p-0.5">
          <ToggleBtn active={view === "render"} onClick={() => setView("render")} icon={ImageIcon} label="Transformed" />
          <ToggleBtn active={view === "map"} onClick={() => setView("map")} icon={Map} label="Planting map" />
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-organic relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {view === "render" ? (
          renderUrl ? (
            <Image src={renderUrl} alt="Your yard, transformed" fill sizes="(max-width:640px) 100vw, 640px" className="object-cover" />
          ) : (
            <Placeholder imageUrl={imageUrl} />
          )
        ) : (
          <>
            <Image src={imageUrl} alt="Your yard" fill sizes="(max-width:640px) 100vw, 640px" className="object-cover" />
            {markers?.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(active === i ? null : i)}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                className={cn(
                  "absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-primary-foreground shadow-lift transition-transform hover:scale-110",
                  active === i ? "bg-accent scale-110" : "bg-primary",
                )}
                aria-label={m.plant}
              >
                {i + 1}
              </button>
            ))}
          </>
        )}

        {isPending && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">
              {view === "render" ? "Growing your garden…" : "Mapping where to plant…"}
            </p>
            <p className="text-xs text-muted-foreground">This can take a moment.</p>
          </div>
        )}
      </div>

      {/* Active marker detail */}
      {view === "map" && active != null && markers?.[active] ? (
        <div className="rounded-organic mt-3 border border-primary/20 bg-primary/5 p-3">
          <p className="text-sm font-bold text-foreground">
            {active + 1}. {markers[active].plant}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{markers[active].why}</p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {/* Generate / regenerate */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {view === "render"
            ? "An AI render of your space with the recommended plants grown in."
            : "Tap a marker to see what to plant there and why."}
        </p>
        <Button onClick={() => generate(view)} disabled={isPending} size="sm" className="rounded-full glow-primary shrink-0">
          <Sparkles className="h-4 w-4" />
          {hasContent ? "Regenerate" : view === "render" ? "Generate render" : "Generate map"}
        </Button>
      </div>
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
        active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function Placeholder({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative h-full w-full">
      <Image src={imageUrl} alt="Your yard" fill sizes="(max-width:640px) 100vw, 640px" className="object-cover opacity-40 blur-[1px]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
        <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground shadow-soft">
          Generate to see your yard transformed
        </span>
      </div>
    </div>
  )
}
